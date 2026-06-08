import { create } from 'zustand';
import type { AppState, CEFRLevel, Course, DailyStat, Rating, TaskKind } from '../types';
import { courses, defaultCourse } from '../data/buildCourse';
import { emptyState, loadState, saveState, clearState, STATE_VERSION } from '../lib/storage';
import { ensureProgress, recomputeAll, THRESHOLDS } from '../lib/adaptive';
import { schedule, createCardProgress } from '../lib/srs';
import { todayKey } from '../lib/date';

export interface OnboardingInput {
  targetLanguage: string;
  nativeLanguage: string;
  goal: string;
  level: CEFRLevel;
  dailyMinutes: number;
}

interface AppStore {
  state: AppState;
  hydrated: boolean;

  course: () => Course;

  hydrate: () => void;
  completeOnboarding: (input: OnboardingInput) => void;
  rateCard: (cardId: string, rating: Rating) => void;
  recordInputResult: (taskId: string, nodeId: string, accuracyPct: number) => void;
  recordOutputResult: (taskId: string, nodeId: string, score: number) => void;
  resetAll: () => void;
  reseed: () => void;
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
    const base: AppState = {
      version: STATE_VERSION,
      profile: {
        onboarded: true,
        targetLanguage: input.targetLanguage,
        nativeLanguage: input.nativeLanguage,
        goal: input.goal,
        level: input.level,
        dailyMinutes: input.dailyMinutes,
        courseId: course.id,
        createdAt: new Date().toISOString(),
      },
      cards: {},
      nodes: {},
      stats: {},
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

  recordInputResult: (_taskId, nodeId, accuracyPct) => {
    const { state } = get();
    const course = get().course();
    const passed = accuracyPct >= THRESHOLDS.passInput;
    const prevNode = state.nodes[nodeId];
    if (!prevNode) return;
    let next: AppState = {
      ...state,
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

  resetAll: () => {
    clearState();
    set({ state: structuredClone(emptyState), hydrated: true });
  },

  // Wipes all study progress but keeps the user profile, then rebuilds fresh
  // progress records from the current course content.
  reseed: () => {
    const { state } = get();
    const course = get().course();
    const fresh: AppState = {
      version: STATE_VERSION,
      profile: state.profile,
      cards: {},
      nodes: {},
      stats: {},
    };
    const rebuilt = recomputeAll(course, ensureProgress(course, fresh));
    set({ state: persist(rebuilt) });
  },
}));
