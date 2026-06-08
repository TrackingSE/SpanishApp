import type {
  AppState,
  AssessmentAttempt,
  CEFRLevel,
  Course,
  LevelProgress,
  LevelStatus,
  SkillNode,
} from '../types';
import { LEVEL_ORDER, levelIndex } from '../data/spanish';

// Level progression and placement.
//
// Progression is driven by passed assessment attempts plus the learner's
// chosen starting level:
//   - levels below the start are "assumed" (placed, not actively studied),
//     unless a diagnostic flags repair work.
//   - the start level is the first "current" level.
//   - a higher level unlocks only when the level directly below it is passed.
//   - C2 is the long-term target and the top of the ladder.

export const ASSUMED_MASTERY = 85;
/** Node-average mastery at which the current level is worth testing. */
export const TEST_READY_AT = 80;

export function nextLevel(level: CEFRLevel): CEFRLevel | null {
  const i = levelIndex(level);
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : null;
}

export function prevLevel(level: CEFRLevel): CEFRLevel | null {
  const i = levelIndex(level);
  return i > 0 ? LEVEL_ORDER[i - 1] : null;
}

export function levelNodes(course: Course, level: CEFRLevel): SkillNode[] {
  return course.nodes.filter((n) => n.level === level);
}

export function attemptsForLevel(state: AppState, level: CEFRLevel): AssessmentAttempt[] {
  return Object.values(state.attempts)
    .filter((a) => a.levelId === level)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

export function levelPassed(state: AppState, level: CEFRLevel): boolean {
  return attemptsForLevel(state, level).some((a) => a.passed);
}

export function bestAttempt(state: AppState, level: CEFRLevel): AssessmentAttempt | null {
  const list = attemptsForLevel(state, level);
  if (list.length === 0) return null;
  return list.reduce((best, a) => (a.score > best.score ? a : best), list[0]);
}

export function lastAttempt(state: AppState, level: CEFRLevel): AssessmentAttempt | null {
  const list = attemptsForLevel(state, level);
  return list.length ? list[list.length - 1] : null;
}

/** Average mastery across a level's nodes (live, from card study). */
export function nodeAverageMastery(course: Course, state: AppState, level: CEFRLevel): number {
  const nodes = levelNodes(course, level);
  if (nodes.length === 0) return 0;
  const sum = nodes.reduce((s, n) => s + (state.nodes[n.id]?.mastery ?? 0), 0);
  return Math.round(sum / nodes.length);
}

export interface LevelComputation {
  byLevel: Record<string, LevelProgress>;
  currentLevel: CEFRLevel;
  status: Record<string, LevelStatus>;
}

/**
 * Computes the status + mastery of every level. Stored LevelProgress fields
 * (weakAreas, repairNodeIds, retest gating) are merged in; status and mastery
 * are derived fresh so they always reflect the latest attempts.
 */
export function computeLevels(course: Course, state: AppState): LevelComputation {
  const startLevel: CEFRLevel = state.profile?.startingLevel ?? 'A1';
  const startIdx = levelIndex(startLevel);

  const byLevel: Record<string, LevelProgress> = {};
  const status: Record<string, LevelStatus> = {};

  // Work out which levels at/above the start are unlocked. The start level is
  // always unlocked; each subsequent one unlocks when the previous is passed.
  let unlockedUpTo = startIdx;
  for (let i = startIdx; i < LEVEL_ORDER.length - 1; i++) {
    if (levelPassed(state, LEVEL_ORDER[i])) unlockedUpTo = i + 1;
    else break;
  }

  let currentLevel: CEFRLevel = startLevel;
  let currentFound = false;

  LEVEL_ORDER.forEach((level, i) => {
    const stored = state.levels[level];
    const passed = levelPassed(state, level);
    const repairNodeIds = stored?.repairNodeIds ?? [];
    const weakAreas = stored?.weakAreas ?? [];
    const failedAreas = stored?.failedAreas ?? [];
    const nodeAvg = nodeAverageMastery(course, state, level);
    const best = bestAttempt(state, level);

    let st: LevelStatus;
    let mastery: number;

    if (i < startIdx) {
      // Placed below the start: assumed known unless flagged for repair.
      if (passed) {
        st = 'passed';
        mastery = Math.max(nodeAvg, best?.score ?? 0, ASSUMED_MASTERY);
      } else if (repairNodeIds.length > 0 || weakAreas.length > 0) {
        st = 'repair';
        mastery = Math.max(nodeAvg, 65);
      } else {
        st = 'assumed';
        mastery = ASSUMED_MASTERY;
      }
    } else if (i > unlockedUpTo) {
      st = 'locked';
      mastery = 0;
    } else if (passed) {
      st = 'passed';
      mastery = Math.max(nodeAvg, best?.score ?? 0);
    } else {
      // Unlocked and unpassed: the working frontier.
      st = nodeAvg >= TEST_READY_AT ? 'test_ready' : 'current';
      mastery = nodeAvg;
      if (!currentFound) {
        currentLevel = level;
        currentFound = true;
      }
    }

    status[level] = st;
    byLevel[level] = {
      levelId: level,
      status: st,
      mastery,
      weakAreas,
      failedAreas,
      repairNodeIds,
      lastAttemptId: lastAttempt(state, level)?.id ?? null,
      attemptsCount: attemptsForLevel(state, level).length,
      repairSessionsSince: stored?.repairSessionsSince ?? 0,
      retestBlockedUntilSessions: stored?.retestBlockedUntilSessions ?? 0,
    };
  });

  // If everything from the start is passed, the current level is the top one.
  if (!currentFound) {
    currentLevel = LEVEL_ORDER[Math.min(unlockedUpTo, LEVEL_ORDER.length - 1)];
  }

  return { byLevel, currentLevel, status };
}

/** Whether a node may be actively studied right now (used to gate cards). */
export function nodeLevelGate(
  node: SkillNode,
  levelStatus: Record<string, LevelStatus>,
  repairNodeIds: Set<string>,
): 'locked' | 'assumed' | 'active' {
  const st = levelStatus[node.level];
  if (st === 'locked') return 'locked';
  if (st === 'assumed' || st === 'repair') {
    return repairNodeIds.has(node.id) ? 'active' : 'assumed';
  }
  return 'active';
}

/** Is the level test currently allowed (retest gating, Part 7)? */
export function retestAllowed(state: AppState, level: CEFRLevel): boolean {
  const lp = state.levels[level];
  if (!lp) return true;
  if (lp.retestBlockedUntilSessions <= 0) return true;
  return state.studySessions >= lp.retestBlockedUntilSessions;
}

export function sessionsUntilRetest(state: AppState, level: CEFRLevel): number {
  const lp = state.levels[level];
  if (!lp) return 0;
  return Math.max(0, lp.retestBlockedUntilSessions - state.studySessions);
}
