import type {
  Assessment,
  AssessmentQuestion,
  AssessmentSection,
  AssessmentSectionId,
  CEFRLevel,
  GrammarPattern,
  PartOfSpeech,
  PassRequirements,
  TranslationPair,
  VocabItem,
} from '../../types';

// Shared authoring helpers for the per-level Spanish content modules.
// Keeping these here lets each level file stay compact and declarative.

// ---------------------------------------------------------------------------
// vocabulary
// ---------------------------------------------------------------------------

export type Raw = [es: string, en: string, pos: PartOfSpeech, exTarget: string, exNative: string];

/** Expand compact tuples into VocabItem records with stable ids. */
export function expandVocab(raw: Record<string, Raw[]>): VocabItem[] {
  return Object.entries(raw).flatMap(([nodeId, items]) =>
    items.map((tuple, i): VocabItem => {
      const [spanish, english, pos, exTarget, exNative] = tuple;
      return {
        id: `${nodeId}-v${i + 1}`,
        nodeId,
        spanish,
        english,
        pos,
        example: { target: exTarget, native: exNative },
        tags: [nodeId, pos],
      };
    }),
  );
}

// ---------------------------------------------------------------------------
// grammar
// ---------------------------------------------------------------------------

const ex = (pairs: [string, string][]): TranslationPair[] =>
  pairs.map(([target, native]) => ({ target, native }));

export const g = (
  id: string,
  title: string,
  explanation: string,
  pattern: string,
  examples: [string, string][],
  commonMistake: string,
): GrammarPattern => ({
  id,
  title,
  explanation,
  pattern,
  examples: ex(examples),
  commonMistake,
  nodeIds: [],
});

// ---------------------------------------------------------------------------
// assessments
// ---------------------------------------------------------------------------

/** Standard hard pass requirements shared by every level (Part 4). */
export const PASS_REQUIREMENTS: PassRequirements = {
  skillAverageMastery: 90,
  criticalSkillMin: 80,
  assessmentMin: 85,
  listeningMin: 75,
  readingMin: 75,
  writingMin: 75,
  grammarVocabMin: 80,
  speakingRequired: true,
  maxUnresolvedWeakAreas: 2,
};

const SECTION_ORDER: AssessmentSectionId[] = [
  'vocabulary',
  'grammar',
  'reading',
  'listening',
  'writing',
  'speaking',
];

const SECTION_TITLE: Record<AssessmentSectionId, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening (audio placeholder)',
  writing: 'Writing',
  speaking: 'Speaking (record-yourself placeholder)',
};

const SECTION_INSTRUCTIONS: Record<AssessmentSectionId, string> = {
  vocabulary: 'Produce the word. No multiple choice. Type the answer.',
  grammar: 'Fix, transform or complete. Small mistakes count as wrong.',
  reading: 'Read closely. The answer is not stated word-for-word.',
  listening:
    'Audio is not recorded yet. Read the line once, then answer from memory without looking back.',
  writing: 'Write a real response. It is scored on length, key content and form.',
  speaking: 'Speak your answer aloud, then mark it complete. Be honest.',
};

/** Question authoring shape — required identity fields, the rest defaulted. */
export type RawQuestion = Pick<AssessmentQuestion, 'section' | 'type' | 'prompt'> &
  Partial<AssessmentQuestion>;

export function mkAssessment(
  levelId: CEFRLevel,
  title: string,
  raw: RawQuestion[],
): Assessment {
  const questions: AssessmentQuestion[] = raw.map((r, i) => ({
    id: `as-${levelId.toLowerCase()}-${i + 1}`,
    passage: undefined,
    audioPlaceholder: r.section === 'listening' ? true : undefined,
    expectedAnswer: undefined,
    acceptedAnswers: [],
    options: undefined,
    answerIndex: undefined,
    distractors: [],
    requiredKeywords: [],
    requiredPatterns: [],
    minWords: r.section === 'writing' ? 25 : undefined,
    skillNodeIds: [],
    vocabularyIds: [],
    grammarIds: [],
    difficulty: 3,
    cefrLevel: levelId,
    weaknessType:
      r.section === 'vocabulary'
        ? 'vocabulary'
        : r.section === 'grammar'
          ? 'grammar'
          : r.section === 'reading'
            ? 'reading'
            : r.section === 'listening'
              ? 'listening'
              : r.section === 'writing'
                ? 'writing'
                : 'production',
    feedback: '',
    explanation: '',
    ...r,
  }));

  const sections: AssessmentSection[] = SECTION_ORDER.filter((sid) =>
    questions.some((q) => q.section === sid),
  ).map((sid) => ({
    id: sid,
    title: SECTION_TITLE[sid],
    instructions: SECTION_INSTRUCTIONS[sid],
    questionIds: questions.filter((q) => q.section === sid).map((q) => q.id),
  }));

  return {
    id: `assessment-${levelId.toLowerCase()}`,
    levelId,
    title,
    sections,
    questions,
    passThresholds: PASS_REQUIREMENTS,
  };
}
