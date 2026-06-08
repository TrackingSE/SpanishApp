import type {
  AppState,
  CardProgress,
  Course,
  NodeProgress,
  NodeStatus,
  SkillNode,
} from '../types';
import { accuracyFromRatings, cardMastery, createCardProgress } from './srs';
import { isDue } from './date';

// Adaptive progression.
//
// Lifecycle status (single value): locked, ready, learning, usable, passed.
//   locked   prerequisites below 80% mastery
//   ready    prerequisites met, not started yet
//   learning started, mastery below 70%
//   usable   mastery 70-89%
//   passed   mastery 90%+
//
// Overlay flags (can apply on top of a lifecycle status):
//   due   has already-studied cards that are overdue
//   weak  recent review accuracy below 70%
//
// Mastery is only allowed past the "passed" line when recent accuracy is high
// and the node's input/output tasks are passed.

export const THRESHOLDS = {
  unlockAt: 80,
  passedAt: 90,
  usableAt: 70,
  weakBelow: 70,
  masteryAccuracy: 85,
  passInput: 70,
  passOutput: 70,
} as const;

export const STATE_LABEL: Record<NodeStatus, string> = {
  locked: 'blocked',
  ready: 'ready',
  learning: 'learning',
  usable: 'usable',
  passed: 'passed',
};

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function createNodeProgress(nodeId: string, status: NodeStatus): NodeProgress {
  return {
    nodeId,
    status,
    mastery: 0,
    reviewAccuracy: 0,
    due: false,
    weak: false,
    inputPassed: false,
    outputPassed: false,
    productionScore: 0,
    cardsSeen: 0,
  };
}

export function ensureProgress(course: Course, state: AppState): AppState {
  const cards: Record<string, CardProgress> = { ...state.cards };
  for (const card of course.flashcards) {
    if (!cards[card.id]) cards[card.id] = createCardProgress(card.id);
  }

  const nodes: Record<string, NodeProgress> = { ...state.nodes };
  for (const node of course.nodes) {
    if (!nodes[node.id]) {
      const status: NodeStatus = node.prerequisites.length === 0 ? 'ready' : 'locked';
      nodes[node.id] = createNodeProgress(node.id, status);
    }
  }

  return { ...state, cards, nodes };
}

function cardProgressesForNode(
  node: SkillNode,
  cards: Record<string, CardProgress>,
): CardProgress[] {
  return node.flashcardIds.map((id) => cards[id]).filter(Boolean);
}

function recomputeNode(
  node: SkillNode,
  prev: NodeProgress,
  cards: Record<string, CardProgress>,
  ref: Date,
): NodeProgress {
  const nodeCards = cardProgressesForNode(node, cards);
  const seen = nodeCards.filter((c) => c.reps > 0 || c.recent.length > 0);
  const cardsSeen = seen.length;

  const recentRatings = nodeCards.flatMap((c) => c.recent);
  const reviewAccuracy = accuracyFromRatings(recentRatings);
  const cardComponent = average(nodeCards.map(cardMastery));

  const hasInput = node.inputTaskIds.length > 0;
  const hasOutput = node.outputTaskIds.length > 0;
  const inputOk = !hasInput || prev.inputPassed;
  const outputOk = !hasOutput || prev.outputPassed;
  const tasksPassed = inputOk && outputOk;

  const taskSignals: number[] = [];
  if (hasInput) taskSignals.push(prev.inputPassed ? 100 : 0);
  if (hasOutput) taskSignals.push(prev.outputPassed ? prev.productionScore || 80 : 0);
  const taskComponent = taskSignals.length ? average(taskSignals) : cardComponent;

  let mastery = Math.round(cardComponent * 0.7 + taskComponent * 0.3);
  const masteryEligible = reviewAccuracy >= THRESHOLDS.masteryAccuracy && tasksPassed;
  if (!masteryEligible) mastery = Math.min(mastery, THRESHOLDS.passedAt - 1);

  const weak = cardsSeen > 0 && reviewAccuracy < THRESHOLDS.weakBelow;
  const due = seen.some((c) => isDue(c.due, ref));

  let status: NodeStatus;
  if (prev.status === 'locked') {
    status = 'locked';
  } else if (cardsSeen === 0) {
    status = 'ready';
  } else if (mastery >= THRESHOLDS.passedAt) {
    status = 'passed';
  } else if (mastery >= THRESHOLDS.usableAt) {
    status = 'usable';
  } else {
    status = 'learning';
  }

  return { ...prev, status, mastery, reviewAccuracy, cardsSeen, weak, due };
}

export function recomputeAll(course: Course, state: AppState, ref: Date = new Date()): AppState {
  const withProgress = ensureProgress(course, state);
  const nodes: Record<string, NodeProgress> = {};

  for (const node of course.nodes) {
    nodes[node.id] = recomputeNode(node, withProgress.nodes[node.id], withProgress.cards, ref);
  }

  // Unlock pass: open nodes whose prerequisites all reached the unlock line.
  for (const node of course.nodes) {
    const np = nodes[node.id];
    if (np.status !== 'locked') continue;
    const prereqsMet =
      node.prerequisites.length === 0 ||
      node.prerequisites.every((pid) => (nodes[pid]?.mastery ?? 0) >= THRESHOLDS.unlockAt);
    if (prereqsMet) {
      nodes[node.id] = recomputeNode(
        node,
        { ...np, status: 'ready' },
        withProgress.cards,
        ref,
      );
    }
  }

  return { ...withProgress, nodes };
}

export function isNodeUnlocked(np: NodeProgress | undefined): boolean {
  return !!np && np.status !== 'locked';
}

/** Titles of prerequisite nodes that are still below the unlock line. */
export function blockingPrereqs(
  course: Course,
  node: SkillNode,
  nodes: Record<string, NodeProgress>,
): string[] {
  return node.prerequisites
    .filter((pid) => (nodes[pid]?.mastery ?? 0) < THRESHOLDS.unlockAt)
    .map((pid) => course.nodes.find((n) => n.id === pid)?.title ?? pid);
}
