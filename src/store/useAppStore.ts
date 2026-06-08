import { create } from 'zustand';
import type {
  AppState,
  AssessmentAnswer,
  CEFRLevel,
  Course,
  DailyStat,
  LevelProgress,
  PronunciationSupport,
  Rating,
  TaskKind,
} from '../types';
import { defaultSupport } from '../lib/pronunciation';
import { courses, defaultCourse, assessmentForLevel } from '../data/buildCourse';
import { emptyState, loadState, saveState, clearState, STATE_VERSION } from '../lib/storage';
import { ensureProgress, recomputeAll, THRESHOLDS } from '../lib/adaptive';
import { gradeAttempt } from '../lib/assessment';
import { nextLevel } from '../lib/levels';
import { LEVEL_ORDER, levelIndex } from '../data/spanish';
import { schedule, createCardProgress } from '../lib/srs';
import { todayKey } from '../lib/date';

export interface OnboardingInput {
  targetLanguage: string;
  nativeLanguage: string;
  goal: string;
  startingLevel: CEFRLevel;
  dailyMinutes: number;
}

interface AppStore {
  state: AppState;
  hydrated: boolean;

  course: () => Course;

  hydrate: () => void;
  completeOnboarding: (input: OnboardingInput) => void;
  rateCard: (cardId: string, rating: Rating) => void;
  recordReviewSession: () => void;
  recordInputResult: (taskId: string, nodeId: string, accuracyPct: number) => void;
  recordOutputResult: (taskId: string, nodeId: string, score: number) => void;
  submitAssessment: (levelId: CEFRLevel, answers: AssessmentAnswer[], startedAt: string) => string;
  setDailyMinutes: (minutes: number) => void;
  setPronunciationSupport: (support: PronunciationSupport) => void;
  resetAll: () => void;
  reseed: () => void;

  // Developer tools.
  devSetStartingLevel: (level: CEFRLevel) => void;
  devForcePass: (level: CEFRLevel) => void;
  devForceFail: (level: CEFRLevel) => void;
}

function blankLevel(levelId: CEFRLevel): LevelProgress {
  return {
    levelId,
    status: 'locked',
    mastery: 0,
    weakAreas: [],
    failedAreas: [],
    repairNodeIds: [],
    lastAttemptId: null,
    attemptsCount: 0,
    repairSessionsSince: 0,
    retestBlockedUntilSessions: 0,
  };
}

function bumpStat(state: AppState, kind: TaskKind, amount = 1): Record<string, DailyStat> {
  const key = todayKey();
  const prev: DailyStat =
    state.stats[key] ??
    { date: key, reviewsDone: 0, lessonsDone: 0, inputDone: 0, outputDone: 0 };
  const next: DailyStat = { ...prev };
  if (kind === 'review') next.reviewsDone += amount;
  if (kind === 'lesson') next.lessonsDone += amount;
  if (kind === 'input') next.inputDone += amount;
  if (kind === 'output') next.outputDone += amount;
  return { ...state.stats, [key]: next };
}

function persist(state: AppState): AppState {
  saveState(state);
  return state;
}

export const useAppStore = create<AppStore>((set, get) => ({
  state: emptyState,
  hydrated: false,

  course: () => {
    const id = get().state.profile?.courseId;
    return (id && courses[id]) || defaultCourse;
  },

  hydrate: () => {
    let loaded = loadState();
    const course = (loaded.profile?.courseId && courses[loaded.profile.courseId]) || defaultCourse;
    loaded = ensureProgress(course, loaded);
    loaded = recomputeAll(course, loaded);
    set({ state: persist(loaded), hydrated: true });
  },

  completeOnboarding: (input) => {
    const course = defaultCourse;
    // Placement: mark lower levels assumed, start level current, higher locked.
    const startIdx = levelIndex(input.startingLevel);
    const levels: Record<string, LevelProgress> = {};
    for (const lvl of LEVEL_ORDER) {
      const i = levelIndex(lvl);
      levels[lvl] = {
        ...blankLevel(lvl),
        status: i < startIdx ? 'assumed' : i === startIdx ? 'current' : 'locked',
        mastery: i < startIdx ? 85 : 0,
      };
    }
    const base: AppState = {
      version: STATE_VERSION,
      profile: {
        onboarded: true,
        targetLanguage: input.targetLanguage,
        nativeLanguage: input.nativeLanguage,
        goal: input.goal,
        startingLevel: input.startingLevel,
        level: input.startingLevel,
        dailyMinutes: input.dailyMinutes,
        pronunciationSupport: defaultSupport(input.startingLevel),
        courseId: course.id,
        createdAt: new Date().toISOString(),
      },
      cards: {},
      nodes: {},
      levels,
      attempts: {},
      stats: {},
      studySessions: 0,
    };
    const withProgress = recomputeAll(course, ensureProgress(course, base));
    set({ state: persist(withProgress) });
  },

  rateCard: (cardId, rating) => {
    const { state } = get();
    const course = get().course();
    const prev = state.cards[cardId] ?? createCardProgress(cardId);
    const updated = schedule(prev, rating);
    let next: AppState = {
      ...state,
      cards: { ...state.cards, [cardId]: updated },
    };
    next = { ...next, stats: bumpStat(next, 'review') };
    next = recomputeAll(course, next);
    set({ state: persist(next) });
  },

  // A completed review session counts toward retest repair requirements.
  recordReviewSession: () => {
    const { state } = get();
    const course = get().course();
    const next = recomputeAll(course, { ...state, studySessions: state.studySessions + 1 });
    set({ state: persist(next) });
  },

  recordInputResult: (_taskId, nodeId, accuracyPct) => {
    const { state } = get();
    const course = get().course();
    const passed = accuracyPct >= THRESHOLDS.passInput;
    const prevNode = state.nodes[nodeId];
    if (!prevNode) return;
    let next: AppState = {
      ...state,
      studySessions: state.studySessions + 1,
      nodes: {
        ...state.nodes,
        [nodeId]: { ...prevNode, inputPassed: prevNode.inputPassed || passed },
      },
    };
    next = { ...next, stats: bumpStat(next, 'input') };
    next = recomputeAll(course, next);
    set({ state: persist(next) });
  },

  recordOutputResult: (_taskId, nodeId, score) => {
    const { state } = get();
    const course = get().course();
    const passed = score >= THRESHOLDS.passOutput;
    const prevNode = state.nodes[nodeId];
    if (!prevNode) return;
    let next: AppState = {
      ...state,
      studySessions: state.studySessions + 1,
      nodes: {
        ...state.nodes,
        [nodeId]: {
          ...prevNode,
          outputPassed: prevNode.outputPassed || passed,
          productionScore: Math.max(prevNode.productionScore, score),
        },
      },
    };
    next = { ...next, stats: bumpStat(next, 'output') };
    next = recomputeAll(course, next);
    set({ state: persist(next) });
  },

  submitAssessment: (levelId, answers, startedAt) => {
    const { state } = get();
    const course = get().course();
    const assessment = assessmentForLevel(course, levelId);
    if (!assessment) return '';

    const id = `att-${Date.now()}`;
    const attempt = gradeAttempt(course, state, assessment, answers, { id, startedAt });
    const attempts = { ...state.attempts, [id]: attempt };
    const prev = state.levels[levelId] ?? blankLevel(levelId);
    const report = attempt.diagnosticReport;

    const levels = { ...state.levels };
    if (attempt.passed) {
      levels[levelId] = {
        ...prev,
        status: 'passed',
        repairNodeIds: [],
        weakAreas: [],
        failedAreas: [],
        retestBlockedUntilSessions: 0,
        lastAttemptId: id,
        attemptsCount: prev.attemptsCount + 1,
      };
    } else {
      levels[levelId] = {
        ...prev,
        repairNodeIds: report.recommendedSkillNodeIds,
        weakAreas: report.weakAreas,
        failedAreas: report.blockingAreas,
        // Retest stays blocked for 2 study sessions (Part 7).
        retestBlockedUntilSessions: state.studySessions + 2,
        repairSessionsSince: 0,
        lastAttemptId: id,
        attemptsCount: prev.attemptsCount + 1,
      };
    }

    let next: AppState = { ...state, attempts, levels };
    if (attempt.passed && next.profile) {
      const nl = nextLevel(levelId);
      if (nl) next = { ...next, profile: { ...next.profile, level: nl } };
    }
    next = recomputeAll(course, next);
    set({ state: persist(next) });
    return id;
  },

  setDailyMinutes: (minutes) => {
    const { state } = get();
    if (!state.profile) return;
    const next = { ...state, profile: { ...state.profile, dailyMinutes: minutes } };
    set({ state: persist(next) });
  },

  setPronunciationSupport: (support) => {
    const { state } = get();
    if (!state.profile) return;
    const next = { ...state, profile: { ...state.profile, pronunciationSupport: support } };
    set({ state: persist(next) });
  },

  resetAll: () => {
    clearState();
    set({ state: structuredClone(emptyState), hydrated: true });
  },

  reseed: () => {
    const { state } = get();
    const course = get().course();
    const fresh: AppState = {
      version: STATE_VERSION,
      profile: state.profile,
      cards: {},
      nodes: {},
      levels: {},
      attempts: {},
      stats: {},
      studySessions: 0,
    };
    const rebuilt = recomputeAll(course, ensureProgress(course, fresh));
    set({ state: persist(rebuilt) });
  },

  devSetStartingLevel: (level) => {
    const { state } = get();
    const course = get().course();
    if (!state.profile) return;
    // Reset progress and re-place at the chosen level.
    const startIdx = levelIndex(level);
    const levels: Record<string, LevelProgress> = {};
    for (const lvl of LEVEL_ORDER) {
      const i = levelIndex(lvl);
      levels[lvl] = {
        ...blankLevel(lvl),
        status: i < startIdx ? 'assumed' : i === startIdx ? 'current' : 'locked',
        mastery: i < startIdx ? 85 : 0,
      };
    }
    const fresh: AppState = {
      version: STATE_VERSION,
      profile: { ...state.profile, startingLevel: level, level },
      cards: {},
      nodes: {},
      levels,
      attempts: {},
      stats: {},
      studySessions: 0,
    };
    const rebuilt = recomputeAll(course, ensureProgress(course, fresh));
    set({ state: persist(rebuilt) });
  },

  // Force a level to "passed" by synthesising a fully-passing attempt.
  devForcePass: (level) => {
    const { state } = get();
    const course = get().course();
    const id = `att-dev-${Date.now()}`;
    const assessment = assessmentForLevel(course, level);
    const levels = { ...state.levels };
    levels[level] = {
      ...(state.levels[level] ?? blankLevel(level)),
      status: 'passed',
      repairNodeIds: [],
      weakAreas: [],
      failedAreas: [],
      retestBlockedUntilSessions: 0,
      lastAttemptId: id,
      attemptsCount: (state.levels[level]?.attemptsCount ?? 0) + 1,
      mastery: 95,
    };
    const attempts = { ...state.attempts };
    if (assessment) {
      attempts[id] = {
        id,
        assessmentId: assessment.id,
        levelId: level,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        score: 95,
        sectionScores: Object.fromEntries(assessment.sections.map((s) => [s.id, 95])),
        answers: [],
        passed: true,
        diagnosticReport: {
          passedAreas: assessment.sections.map((s) => s.id),
          weakAreas: [],
          blockingAreas: [],
          recommendedSkillNodeIds: [],
          recommendedCardIds: [],
          recommendedInputTaskIds: [],
          recommendedOutputTaskIds: [],
          retestEligible: true,
          summary: [`Forced pass of ${level} (dev).`],
          unknownConcepts: [],
        },
      };
    }
    let next: AppState = { ...state, levels, attempts };
    if (next.profile) {
      const nl = nextLevel(level);
      if (nl && levelIndex(nl) > levelIndex(next.profile.level)) {
        next = { ...next, profile: { ...next.profile, level: nl } };
      }
    }
    next = recomputeAll(course, next);
    set({ state: persist(next) });
  },

  // Force a failing attempt for a level to exercise the diagnostic flow.
  devForceFail: (level) => {
    const course = get().course();
    const assessment = assessmentForLevel(course, level);
    if (!assessment) return;
    const failingAnswers: AssessmentAnswer[] = assessment.questions.map((q) => ({
      questionId: q.id,
      userAnswer: '',
      result: 'unknown',
      markedUnknown: true,
      markedGuessed: false,
      flagged: false,
      timeSpentSeconds: 0,
    }));
    get().submitAssessment(level, failingAnswers, new Date().toISOString());
  },
}));
