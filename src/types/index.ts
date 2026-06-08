// Core domain types.
// Content model (course) is separated from learner progress so content can be
// regenerated / reseeded without touching progress logic.

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Lifecycle status of a skill node. `due` and `weak` are tracked as separate
// flags on NodeProgress (a node can be e.g. "usable" and also "due").
export type NodeStatus = 'locked' | 'ready' | 'learning' | 'usable' | 'passed';

export type CardType =
  | 'vocab_recognition'
  | 'vocab_production'
  | 'cloze'
  | 'sentence_translation'
  | 'audio_comprehension'
  | 'grammar_pattern'
  | 'question_answer';

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adj'
  | 'adv'
  | 'phrase'
  | 'pronoun'
  | 'prep'
  | 'number'
  | 'interj'
  | 'conj'
  | 'article';

export type InputTaskType =
  | 'reading'
  | 'listening'
  | 'dialogue'
  | 'menu'
  | 'sign'
  | 'message'
  | 'travel';

export type OutputTaskType =
  | 'write_sentence'
  | 'answer_question'
  | 'translate'
  | 'roleplay'
  | 'describe'
  | 'order_food'
  | 'ask_directions'
  | 'travel_problem';

// ---------------------------------------------------------------------------
// Content model
// ---------------------------------------------------------------------------

export interface TranslationPair {
  target: string;
  native: string;
}

export interface Unit {
  id: string;
  title: string;
  goal: string;
  order: number;
}

export interface SkillNode {
  id: string;
  unitId: string;
  title: string;
  /** Plain, practical can-do goal. */
  goal: string;
  level: CEFRLevel;
  prerequisites: string[];
  grammarIds: string[];
  vocabularyIds: string[];
  flashcardIds: string[];
  inputTaskIds: string[];
  outputTaskIds: string[];
  position: { col: number; row: number };
}

export interface VocabItem {
  id: string;
  nodeId: string;
  spanish: string;
  english: string;
  pos: PartOfSpeech;
  example: TranslationPair;
  tags: string[];
}

export interface GrammarPattern {
  id: string;
  title: string;
  explanation: string;
  /** A skeleton like "[subject] + ser + [adjective]". */
  pattern: string;
  examples: TranslationPair[];
  commonMistake: string;
  nodeIds: string[];
}

export interface Flashcard {
  id: string;
  nodeId: string;
  type: CardType;
  /** Prompt instruction shown above the card (plain voice). */
  prompt: string;
  /** What the learner is shown. */
  front: string;
  /** Canonical answer. */
  back: string;
  alternates?: string[];
  /** Full target sentence for cloze / translation / pattern cards. */
  sentence?: string;
  hint?: string;
}

export interface ComprehensionQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
}

export interface InputTask {
  id: string;
  nodeId: string;
  title: string;
  type: InputTaskType;
  text: string;
  /** Seed estimate of % known words for a learner who finished this node. */
  coverageEstimate: number;
  targetVocab: string[];
  glossary: { word: string; meaning: string }[];
  questions: ComprehensionQuestion[];
}

export interface OutputTask {
  id: string;
  nodeId: string;
  title: string;
  type: OutputTaskType;
  prompt: string;
  minWords: number;
  /** Grammar patterns a good answer should use (plain descriptions). */
  expectedPatterns: string[];
  /** Accepted keywords/phrases (lowercased, accent-insensitive compare). */
  targetKeywords: string[];
  sampleAnswer: string;
}

export interface Course {
  id: string;
  targetLanguage: string;
  nativeLanguage: string;
  level: CEFRLevel;
  theme: string;
  title: string;
  units: Unit[];
  nodes: SkillNode[];
  grammar: GrammarPattern[];
  vocab: VocabItem[];
  flashcards: Flashcard[];
  inputTasks: InputTask[];
  outputTasks: OutputTask[];
}

// ---------------------------------------------------------------------------
// Progress model
// ---------------------------------------------------------------------------

export interface UserProfile {
  onboarded: boolean;
  targetLanguage: string;
  nativeLanguage: string;
  goal: string;
  level: CEFRLevel;
  dailyMinutes: number;
  courseId: string;
  createdAt: string;
}

export interface CardProgress {
  cardId: string;
  due: string;
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
  lastReviewed: string | null;
  recent: Rating[];
}

export interface NodeProgress {
  nodeId: string;
  status: NodeStatus;
  mastery: number;
  reviewAccuracy: number;
  /** Has overdue, already-studied cards. */
  due: boolean;
  /** Recent accuracy below the weak threshold. */
  weak: boolean;
  inputPassed: boolean;
  outputPassed: boolean;
  productionScore: number;
  cardsSeen: number;
}

export interface DailyStat {
  date: string;
  reviewsDone: number;
  lessonsDone: number;
  inputDone: number;
  outputDone: number;
}

export interface AppState {
  version: number;
  profile: UserProfile | null;
  cards: Record<string, CardProgress>;
  nodes: Record<string, NodeProgress>;
  stats: Record<string, DailyStat>;
}

// ---------------------------------------------------------------------------
// Today plan
// ---------------------------------------------------------------------------

export type TaskKind = 'review' | 'lesson' | 'input' | 'output';

export interface TodayItem {
  kind: TaskKind;
  title: string;
  /** Plain reason this is on the list today. */
  why: string;
  priority: number;
  to: string;
  meta?: Record<string, string | number>;
}
