import type {
  AppState,
  Course,
  Flashcard,
  SkillNode,
  StudyPlan,
  StudyTask,
  StudyTaskType,
} from '../types';
import { isNodeUnlocked, THRESHOLDS } from './adaptive';
import { computeLevels, lastAttempt, levelNodes, retestAllowed, TEST_READY_AT } from './levels';
import { daysOverdue, isDue, todayKey } from './date';

// Adaptive daily planner (Part 8). The plan answers: what to do today, why,
// and what it unlocks — shaped to the learner's available minutes.

export function getDueCards(course: Course, state: AppState, ref: Date = new Date()): Flashcard[] {
  const unlocked = new Set(
    course.nodes.filter((n) => isNodeUnlocked(state.nodes[n.id])).map((n) => n.id),
  );
  return course.flashcards.filter((c) => {
    if (!unlocked.has(c.nodeId)) return false;
    const cp = state.cards[c.id];
    if (!cp) return false;
    const seen = cp.reps > 0 || cp.recent.length > 0;
    return seen && isDue(cp.due, ref);
  });
}

function maxOverdue(course: Course, state: AppState, ref: Date): number {
  return getDueCards(course, state, ref).reduce(
    (m, c) => Math.max(m, daysOverdue(state.cards[c.id].due, ref)),
    0,
  );
}

export function nextNewNode(course: Course, state: AppState, level?: string): SkillNode | null {
  return (
    course.nodes.find(
      (n) =>
        state.nodes[n.id]?.status === 'ready' &&
        !state.nodes[n.id]?.assumed &&
        (!level || n.level === level),
    ) ?? null
  );
}

// Time estimates (minutes) per task type — coarse but consistent.
const EST: Record<StudyTaskType, number> = {
  review: 6,
  lesson: 12,
  repair: 8,
  input: 10,
  output: 12,
  diagnostic: 10,
  level_test: 25,
  recap: 4,
};

let taskCounter = 0;
function task(t: Omit<StudyTask, 'id'>): StudyTask {
  taskCounter += 1;
  return { id: `task-${taskCounter}`, ...t };
}

export function buildStudyPlan(
  course: Course,
  state: AppState,
  minutes: number,
  ref: Date = new Date(),
): StudyPlan {
  taskCounter = 0;
  const np = (id: string) => state.nodes[id];
  const { currentLevel, status } = computeLevels(course, state);

  const due = getDueCards(course, state, ref);
  const overdue = maxOverdue(course, state, ref);

  const activeNodes = course.nodes.filter(
    (n) => isNodeUnlocked(np(n.id)) && !np(n.id)?.assumed && n.level === currentLevel,
  );
  const repairNodes = course.nodes.filter((n) => np(n.id)?.repair);
  const weakNodes = activeNodes.filter((n) => np(n.id)?.weak);
  const learningNode = activeNodes.find(
    (n) => np(n.id)?.status === 'learning' && !np(n.id)?.weak,
  );
  const newNode = nextNewNode(course, state, currentLevel);
  const focusNode = learningNode ?? weakNodes[0] ?? repairNodes[0] ?? newNode ?? activeNodes[0];

  const inputTask = course.inputTasks.find((t) => {
    const n = np(t.nodeId);
    return isNodeUnlocked(n) && !n?.assumed && (n?.cardsSeen ?? 0) > 0 && !n?.inputPassed;
  });
  const outputTask = course.outputTasks.find((t) => {
    const n = np(t.nodeId);
    return isNodeUnlocked(n) && !n?.assumed && (n?.cardsSeen ?? 0) > 0 && !n?.outputPassed;
  });

  const levelStatus = status[currentLevel];
  const levelTestEligible =
    (levelStatus === 'test_ready' || levelStatus === 'current') &&
    retestAllowed(state, currentLevel);
  const nodeAvg = levelNodes(course, currentLevel).length
    ? Math.round(
        levelNodes(course, currentLevel).reduce((s, n) => s + (np(n.id)?.mastery ?? 0), 0) /
          levelNodes(course, currentLevel).length,
      )
    : 0;
  const testWorthIt = nodeAvg >= TEST_READY_AT;

  const reviewLoadHeavy = due.length > 12;
  const overloaded = due.length > Math.max(10, Math.round(minutes / 3));

  const tasks: StudyTask[] = [];

  // 1) Reviews always come first when due.
  if (due.length > 0) {
    const cap = minutes <= 15 ? 8 : minutes <= 30 ? 10 : minutes <= 60 ? 14 : 18;
    tasks.push(
      task({
        type: 'review',
        title: `Clear ${due.length} due review${due.length === 1 ? '' : 's'}`,
        estimatedMinutes: Math.min(cap, Math.max(4, Math.round(due.length * 0.5))),
        priority: 100 + Math.min(overdue, 30),
        reason:
          overdue >= 1
            ? `Overdue by ${overdue} day${overdue === 1 ? '' : 's'}. Memory fades fastest here.`
            : 'Due today. Clear these before new material.',
        unlocks: 'Keeps earlier skills from slipping back into repair.',
        to: '/review',
      }),
    );
  }

  // Helper to push a repair task for a node.
  function pushRepair(node: SkillNode, priority: number) {
    tasks.push(
      task({
        type: 'repair',
        title: `Repair: ${node.title}`,
        estimatedMinutes: EST.repair,
        priority,
        reason: np(node.id)?.repair
          ? 'Diagnostic flagged this as weak. It is blocking the level.'
          : `Recent accuracy ${np(node.id)?.reviewAccuracy ?? 0}%. Re-drill before moving on.`,
        unlocks: `Lifts ${currentLevel} skill mastery toward the 90% gate.`,
        linkedSkillNodeId: node.id,
        to: `/review?node=${node.id}`,
      }),
    );
  }

  function pushLesson(node: SkillNode, priority: number, main = false) {
    const isNew = np(node.id)?.status === 'ready';
    tasks.push(
      task({
        type: 'lesson',
        title: `${isNew ? 'Start' : 'Continue'}: ${node.title}`,
        estimatedMinutes: EST.lesson,
        priority,
        reason: main
          ? `Main target. ${node.goal}`
          : isNew
            ? `Next skill in ${currentLevel}.`
            : `In progress — mastery ${np(node.id)?.mastery ?? 0}%.`,
        unlocks: `Progress toward finishing ${currentLevel}.`,
        linkedSkillNodeId: node.id,
        to: `/lesson/${node.id}`,
      }),
    );
  }

  function pushInput(priority: number) {
    if (!inputTask) return;
    tasks.push(
      task({
        type: 'input',
        title: `Read / listen: ${inputTask.title}`,
        estimatedMinutes: EST.input,
        priority,
        reason: 'Lock in studied words by meeting them in context.',
        unlocks: 'Counts toward the input requirement for the skill.',
        linkedSkillNodeId: inputTask.nodeId,
        to: `/input/${inputTask.id}`,
      }),
    );
  }

  function pushOutput(priority: number) {
    if (!outputTask) return;
    tasks.push(
      task({
        type: 'output',
        title: `Write: ${outputTask.title}`,
        estimatedMinutes: EST.output,
        priority,
        reason: 'Produce it without looking. Production is where it sticks.',
        unlocks: 'Counts toward the output requirement for the skill.',
        linkedSkillNodeId: outputTask.nodeId,
        to: `/output/${outputTask.id}`,
      }),
    );
  }

  function pushDiagnostic(priority: number) {
    tasks.push(
      task({
        type: 'diagnostic',
        title: repairNodes.length ? 'Work the repair queue' : `Review the ${currentLevel} pass criteria`,
        estimatedMinutes: EST.diagnostic,
        priority,
        reason: repairNodes.length
          ? 'Clear flagged weaknesses so the level test can pass.'
          : 'Check exactly what is still blocking the next level.',
        unlocks: `Unblocks the ${currentLevel} level test.`,
        to: `/level/${currentLevel}`,
      }),
    );
  }

  function pushLevelTest(priority: number) {
    tasks.push(
      task({
        type: 'level_test',
        title: `Take the ${currentLevel} level test`,
        estimatedMinutes: EST.level_test,
        priority,
        reason: testWorthIt
          ? 'You are at the line. A pass unlocks the next CEFR stage.'
          : 'A diagnostic attempt will map exactly what to repair.',
        unlocks: 'Passing opens the next level.',
        to: `/assessment/${currentLevel}`,
      }),
    );
  }

  function pushRecap(priority: number) {
    tasks.push(
      task({
        type: 'recap',
        title: 'Recap and check the roadmap',
        estimatedMinutes: EST.recap,
        priority,
        reason: 'Close the session by seeing what moved and what is next.',
        unlocks: `Long-term target: C2. Next stage: ${currentLevel}.`,
        to: '/roadmap',
      }),
    );
  }

  // ---- Compose by available time ----
  if (minutes <= 15) {
    if (weakNodes[0] || repairNodes[0]) pushRepair(weakNodes[0] ?? repairNodes[0], 80);
    if (!reviewLoadHeavy && tasks.length < 2 && focusNode) pushLesson(focusNode, 60, true);
  } else if (minutes <= 30) {
    if (repairNodes[0] || weakNodes[0]) pushRepair(repairNodes[0] ?? weakNodes[0], 80);
    else if (focusNode) pushLesson(focusNode, 70, true);
    if (outputTask) pushOutput(55);
    else pushInput(55);
  } else if (minutes <= 60) {
    if (focusNode) pushLesson(focusNode, 75, true);
    pushInput(60);
    pushOutput(55);
    if (weakNodes[0] || repairNodes[0]) pushRepair(weakNodes[0] ?? repairNodes[0], 65);
    pushRecap(20);
  } else {
    // 120 minutes
    if (focusNode) pushLesson(focusNode, 80, true);
    if (newNode && newNode.id !== focusNode?.id) pushLesson(newNode, 72);
    else if (weakNodes[1]) pushLesson(weakNodes[1], 72);
    pushInput(64);
    pushOutput(58);
    pushDiagnostic(50);
    if (levelTestEligible) pushLevelTest(48);
    pushRecap(20);
  }

  tasks.sort((a, b) => b.priority - a.priority);

  const estimatedMinutes = tasks.reduce((s, t) => s + t.estimatedMinutes, 0);

  // ---- Headline strings ----
  const mainTarget = focusNode
    ? `Finish ${currentLevel}: ${focusNode.title.toLowerCase()}`
    : levelStatus === 'passed'
      ? `${currentLevel} is passed — open the next stage`
      : `Finish ${currentLevel}`;

  const last = lastAttempt(state, currentLevel);
  let blockingNextLevel: string[];
  if (last && !last.passed) {
    blockingNextLevel = last.diagnosticReport.weakAreas.slice(0, 4);
  } else if (nodeAvg < THRESHOLDS.passedAt) {
    blockingNextLevel = [`${currentLevel} skill mastery (${nodeAvg}% of 90%)`, `pass the ${currentLevel} level test`];
  } else {
    blockingNextLevel = [`pass the ${currentLevel} level test`];
  }

  const explanation =
    minutes <= 15
      ? 'Short session: clear what is overdue, then one weak skill. New material waits.'
      : minutes <= 30
        ? 'Half session: reviews, then one lesson or repair, then a little production.'
        : minutes <= 60
          ? 'Full session: reviews, a main lesson, input, output, repair and a recap.'
          : 'Long session: reviews, two learning blocks, real input/output, a diagnostic block, and the level test if you are ready.';

  return {
    date: todayKey(ref),
    selectedMinutes: minutes,
    tasks,
    mainTarget,
    blockingNextLevel,
    explanation,
    overloadedWithReviews: overloaded,
    estimatedMinutes,
  };
}
