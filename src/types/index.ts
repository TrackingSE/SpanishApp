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
  /** Learner respelling of the target (CAPS = stress), e.g. OH-lah. */
  pronunciation?: string;
  /** Broad learner IPA, e.g. /ˈola/. */
  ipa?: string;
  /** Short stress / pronunciation note, only when it helps. */
  stressNotes?: string;
}

/** Pronunciation support level (Part 7). */
export type PronunciationSupport = 'off' | 'basic' | 'full';

export interface Unit {
  id: string;
  title: string;
  goal: string;
  order: number;
  level: CEFRLevel;
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
  /** Critical skills must clear a higher floor for the level to pass. */
  critical?: boolean;
}

export interface VocabItem {
  id: string;
  nodeId: string;
  spanish: string;
  english: string;
  pos: PartOfSpeech;
  example: TranslationPair;
  tags: string[];
  // Written pronunciation support (Part 1). Populated for every item in
  // buildCourse via the deterministic generator, so these are never empty.
  /** Learner respelling of the word, e.g. ehs-tah-SYOHN. */
  pronunciation?: string;
  /** Broad learner IPA, e.g. /estaˈsjon/. */
  ipa?: string;
  /** Syllable breakdown in normal spelling, e.g. es-ta-ción. */
  syllables?: string;
  /** The stressed syllable, e.g. ción. */
  stress?: string;
  /** Warnings for common English-speaker mistakes (only when relevant). */
  pronunciationNotes?: string[];
  /** Respelling of the example sentence. */
  examplePronunciation?: string;
  /** Broad IPA of the example sentence. */
  exampleIpa?: string;
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
  // Pronunciation of the Spanish side of the card (Part 1 / Part 2).
  /** Learner respelling of the Spanish answer. */
  pronunciation?: string;
  /** Broad IPA of the Spanish answer. */
  ipa?: string;
  /** Short respelling hint, shown only after answering when revealed. */
  pronunciationHint?: string;
  /** Reveal pronunciation once the answer is shown. */
  showPronunciationAfterAnswer?: boolean;
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
  // Pronunciation view (Part 2). Line-by-line respelling of the text.
  textWithPronunciation?: { line: string; pronunciation: string; ipa: string }[];
  /** Warnings relevant to this text. */
  pronunciationNotes?: string[];
  /** Tricky words worth drilling, as "word → respelling". */
  targetPronunciationPoints?: string[];
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
  /** Full CEFR ladder A1 -> C2. */
  levels: CEFRLevelDef[];
  /** One final assessment per level. */
  assessments: Assessment[];
}

// ---------------------------------------------------------------------------
// CEFR level structure
// ---------------------------------------------------------------------------

/** Hard pass requirements for a level (Part 4). */
export interface PassRequirements {
  /** Average mastery across the level's skill nodes. */
  skillAverageMastery: number;
  /** No critical skill may sit below this. */
  criticalSkillMin: number;
  /** Final assessment overall score. */
  assessmentMin: number;
  listeningMin: number;
  readingMin: number;
  writingMin: number;
  grammarVocabMin: number;
  speakingRequired: boolean;
  maxUnresolvedWeakAreas: number;
}

export interface CEFRLevelDef {
  id: CEFRLevel;
  title: string;
  /** Plain, practical description of what the level means in real life. */
  description: string;
  canDoGoals: string[];
  unitIds: string[];
  skillNodeIds: string[];
  finalAssessmentId: string;
  passRequirements: PassRequirements;
}

// ---------------------------------------------------------------------------
// Assessments
// ---------------------------------------------------------------------------

export type AssessmentSectionId =
  | 'vocabulary'
  | 'grammar'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking';

export type WeaknessType =
  | 'vocabulary'
  | 'grammar'
  | 'listening'
  | 'reading'
  | 'writing'
  | 'production'
  | 'recall_speed';

export type AssessmentQuestionType =
  | 'vocab_production'
  | 'sentence_completion'
  | 'cloze'
  | 'sentence_correction'
  | 'transformation'
  | 'error_spotting'
  | 'reading_comprehension'
  | 'listening_comprehension'
  | 'writing_response'
  | 'speaking_prompt';

/** Per-question outcome, set by the learner or derived from the answer. */
export type QuestionResult =
  | 'correct'
  | 'incorrect'
  | 'guessed'
  | 'unknown'
  | 'skipped'
  | 'flagged';

export interface AssessmentQuestion {
  id: string;
  section: AssessmentSectionId;
  type: AssessmentQuestionType;
  prompt: string;
  /** Reading text or listening transcript (listening is an audio placeholder). */
  passage?: string;
  audioPlaceholder?: boolean;
  /** Canonical free-text answer (accent/case-insensitive compare). */
  expectedAnswer?: string;
  acceptedAnswers?: string[];
  /** Optional multiple-choice options; tests avoid being MC-only. */
  options?: string[];
  answerIndex?: number;
  distractors?: string[];
  /** Writing tasks: rule-based scoring hints. */
  requiredKeywords?: string[];
  requiredPatterns?: string[];
  minWords?: number;
  skillNodeIds: string[];
  vocabularyIds: string[];
  grammarIds: string[];
  difficulty: number;
  cefrLevel: CEFRLevel;
  weaknessType: WeaknessType;
  feedback: string;
  explanation: string;
  // Pronunciation of the correct Spanish answer, shown in review (Part 2).
  /** Respelling of the expected Spanish answer. */
  expectedAnswerPronunciation?: string;
  /** Broad IPA of the expected Spanish answer. */
  pronunciationHint?: string;
  /** The single most relevant pronunciation warning for this answer. */
  pronunciationFocus?: string;
}

export interface AssessmentSection {
  id: AssessmentSectionId;
  title: string;
  instructions: string;
  questionIds: string[];
}

export interface Assessment {
  id: string;
  levelId: CEFRLevel;
  title: string;
  sections: AssessmentSection[];
  questions: AssessmentQuestion[];
  passThresholds: PassRequirements;
}

export interface AssessmentAnswer {
  questionId: string;
  userAnswer: string;
  result: QuestionResult;
  markedUnknown: boolean;
  markedGuessed: boolean;
  flagged: boolean;
  timeSpentSeconds: number;
}

export interface DiagnosticReport {
  passedAreas: string[];
  weakAreas: string[];
  blockingAreas: string[];
  recommendedSkillNodeIds: string[];
  recommendedCardIds: string[];
  recommendedInputTaskIds: string[];
  recommendedOutputTaskIds: string[];
  retestEligible: boolean;
  /** Plain-voice summary lines shown to the learner. */
  summary: string[];
  /** Concrete concepts the learner marked unknown. */
  unknownConcepts: string[];
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  levelId: CEFRLevel;
  startedAt: string;
  completedAt: string;
  score: number;
  sectionScores: Record<string, number>;
  answers: AssessmentAnswer[];
  passed: boolean;
  diagnosticReport: DiagnosticReport;
}

// ---------------------------------------------------------------------------
// Level progress (runtime)
// ---------------------------------------------------------------------------

export type LevelStatus =
  | 'locked'
  | 'assumed'
  | 'current'
  | 'repair'
  | 'test_ready'
  | 'passed';

export interface LevelProgress {
  levelId: CEFRLevel;
  status: LevelStatus;
  mastery: number;
  /** Plain labels of weak areas surfaced by the last diagnostic. */
  weakAreas: string[];
  failedAreas: string[];
  /** Skill nodes added to the plan as repair work. */
  repairNodeIds: string[];
  lastAttemptId: string | null;
  attemptsCount: number;
  /** Study sessions completed since the last failed test. */
  repairSessionsSince: number;
  /** Test stays blocked until study-session count reaches this. */
  retestBlockedUntilSessions: number;
}

// ---------------------------------------------------------------------------
// Progress model
// ---------------------------------------------------------------------------

export interface UserProfile {
  onboarded: boolean;
  targetLanguage: string;
  nativeLanguage: string;
  goal: string;
  /** Level the learner selected during onboarding (placement). */
  startingLevel: CEFRLevel;
  /** Level the learner is actively working on now. */
  level: CEFRLevel;
  /** Daily study budget in minutes: 15 | 30 | 60 | 120. */
  dailyMinutes: number;
  /** Pronunciation support level. Undefined = auto by level (Part 7). */
  pronunciationSupport?: PronunciationSupport;
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
  /** Belongs to a level the learner placed past — assumed known. */
  assumed: boolean;
  /** Diagnostic flagged this node for repair even though assumed. */
  repair: boolean;
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
  levels: Record<string, LevelProgress>;
  attempts: Record<string, AssessmentAttempt>;
  stats: Record<string, DailyStat>;
  /** Monotonic counter of completed study sessions (for retest gating). */
  studySessions: number;
}

// ---------------------------------------------------------------------------
// Study plan
// ---------------------------------------------------------------------------

export type TaskKind = 'review' | 'lesson' | 'input' | 'output';

export type StudyTaskType =
  | 'review'
  | 'lesson'
  | 'repair'
  | 'input'
  | 'output'
  | 'diagnostic'
  | 'level_test'
  | 'recap';

export interface StudyTask {
  id: string;
  type: StudyTaskType;
  title: string;
  estimatedMinutes: number;
  priority: number;
  /** Plain reason this task appears today. */
  reason: string;
  /** What finishing it moves toward. */
  unlocks: string;
  linkedSkillNodeId?: string;
  to: string;
}

export interface StudyPlan {
  date: string;
  selectedMinutes: number;
  tasks: StudyTask[];
  mainTarget: string;
  blockingNextLevel: string[];
  explanation: string;
  overloadedWithReviews: boolean;
  estimatedMinutes: number;
}

export interface TodayItem {
  kind: TaskKind;
  title: string;
  /** Plain reason this is on the list today. */
  why: string;
  priority: number;
  to: string;
  meta?: Record<string, string | number>;
}
