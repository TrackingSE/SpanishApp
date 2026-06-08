import type { AppState, Course, Flashcard, SkillNode, TodayItem } from '../types';
import { isNodeUnlocked } from './adaptive';
import { daysOverdue, isDue } from './date';

// Builds the prioritized plan. Order:
//   1. overdue reviews
//   2. weak skills
//   3. current learning skill
//   4. input task for recently studied material
//   5. output task
//   6. a new skill, only if the review load is manageable

const MANAGEABLE_DUE = 12;

export function getDueCards(
  course: Course,
  state: AppState,
  ref: Date = new Date(),
): Flashcard[] {
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

function unlocksTitles(course: Course, nodeId: string): string[] {
  return course.nodes
    .filter((n) => n.prerequisites.includes(nodeId))
    .map((n) => n.title);
}

export function nextNewNode(course: Course, state: AppState): SkillNode | null {
  return course.nodes.find((n) => state.nodes[n.id]?.status === 'ready') ?? null;
}

export function buildToday(course: Course, state: AppState, ref: Date = new Date()): TodayItem[] {
  const items: TodayItem[] = [];
  const np = (id: string) => state.nodes[id];

  // 1) overdue reviews
  const due = getDueCards(course, state, ref);
  if (due.length > 0) {
    const overdue = maxOverdue(course, state, ref);
    items.push({
      kind: 'review',
      title: `Review ${due.length} card${due.length === 1 ? '' : 's'}`,
      why:
        overdue >= 1
          ? `Overdue by ${overdue} day${overdue === 1 ? '' : 's'}. Review before adding new words.`
          : 'Due today. Clear these before new material.',
      priority: 100 + Math.min(overdue, 30),
      to: '/review',
      meta: { count: due.length },
    });
  }

  // 2) weak skills
  const weakNodes = course.nodes.filter((n) => isNodeUnlocked(np(n.id)) && np(n.id)?.weak);
  for (const node of weakNodes) {
    items.push({
      kind: 'lesson',
      title: `Re-drill ${node.title}`,
      why: `You are weak on ${node.title.toLowerCase()}. Recent accuracy ${np(node.id)!.reviewAccuracy}%.`,
      priority: 85,
      to: `/review?node=${node.id}`,
      meta: { mastery: np(node.id)!.mastery },
    });
  }

  // 3) current learning skill
  const learning = course.nodes.find(
    (n) => isNodeUnlocked(np(n.id)) && np(n.id)?.status === 'learning' && !np(n.id)?.weak,
  );
  if (learning) {
    items.push({
      kind: 'lesson',
      title: `Keep working on ${learning.title}`,
      why: `In progress. Mastery ${np(learning.id)!.mastery}%. Finish the set.`,
      priority: 70,
      to: `/lesson/${learning.id}`,
    });
  }

  // 4) input task for recently studied material
  const inputTask = course.inputTasks.find((t) => {
    const n = np(t.nodeId);
    return isNodeUnlocked(n) && (n?.cardsSeen ?? 0) > 0 && !n?.inputPassed;
  });
  if (inputTask) {
    const node = course.nodes.find((n) => n.id === inputTask.nodeId);
    items.push({
      kind: 'input',
      title: `Read: ${inputTask.title}`,
      why: `Ready for input. Use the ${node?.title.toLowerCase() ?? ''} words you studied.`,
      priority: 60,
      to: `/input/${inputTask.id}`,
    });
  }

  // 5) output task
  const outputTask = course.outputTasks.find((t) => {
    const n = np(t.nodeId);
    return isNodeUnlocked(n) && (n?.cardsSeen ?? 0) > 0 && !n?.outputPassed;
  });
  if (outputTask) {
    items.push({
      kind: 'output',
      title: `Write: ${outputTask.title}`,
      why: 'Passed the cards. Now produce it without looking.',
      priority: 50,
      to: `/output/${outputTask.id}`,
    });
  }

  // 6) a new skill, only if review load is manageable
  const newNode = nextNewNode(course, state);
  if (newNode && due.length <= MANAGEABLE_DUE) {
    const unlocks = unlocksTitles(course, newNode.id);
    const unit = course.units.find((u) => u.id === newNode.unitId);
    items.push({
      kind: 'lesson',
      title: `Start: ${newNode.title}`,
      why:
        unlocks.length > 0
          ? `Next because it unlocks ${unlocks.slice(0, 2).join(' and ').toLowerCase()}.`
          : `Next skill in ${unit?.title ?? 'this unit'}.`,
      priority: 40,
      to: `/lesson/${newNode.id}`,
    });
  }

  return items.sort((a, b) => b.priority - a.priority);
}
