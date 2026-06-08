import type {
  Assessment,
  CEFRLevel,
  CEFRLevelDef,
  Course,
  Flashcard,
  GrammarPattern,
  InputTask,
  InputTaskType,
  OutputTask,
  OutputTaskType,
  SkillNode,
  Unit,
  VocabItem,
} from '../types';
import { levelBundles } from './spanish';
import type { NodeSeed } from './spanish/types';
import {
  enrichAssessment,
  enrichCard,
  enrichGrammar,
  enrichInputTask,
  enrichVocab,
} from '../lib/enrichPron';

// Assembles the full A1 -> C2 course from per-level content bundles.
// Flashcards and tasks are generated deterministically so ids stay stable
// across reloads (progress persistence keys on card / task ids).

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function makeCloze(target: string, head: string): { sentence: string; answer: string } | null {
  const idx = target.toLowerCase().indexOf(head.toLowerCase());
  if (idx === -1) return null;
  const answer = target.slice(idx, idx + head.length);
  const sentence = target.slice(0, idx) + '____' + target.slice(idx + head.length);
  const remaining = sentence.replace(/[^\p{L}]/gu, '');
  if (remaining.length < 2) return null;
  return { sentence, answer };
}

function distractors(pool: string[], answer: string, seed: number, n: number): string[] {
  const res: string[] = [];
  let i = Math.abs(seed);
  let guard = 0;
  while (res.length < n && guard < pool.length * 2) {
    const cand = pool[i % pool.length];
    if (cand && cand !== answer && !res.includes(cand)) res.push(cand);
    i += 7;
    guard += 1;
  }
  return res;
}

function withAnswer(answer: string, distrs: string[], slot: number) {
  const options = [...distrs];
  const safeSlot = Math.min(slot, options.length);
  options.splice(safeSlot, 0, answer);
  return { options, answerIndex: safeSlot };
}

// ---------------------------------------------------------------------------
// flashcard generation (per level)
// ---------------------------------------------------------------------------

function buildFlashcards(
  bundleVocab: VocabItem[],
  bundleGrammar: GrammarPattern[],
  nodeSeeds: NodeSeed[],
): Flashcard[] {
  const cards: Flashcard[] = [];
  const grammarNode = new Map<string, string>();
  for (const seed of nodeSeeds) {
    for (const gid of seed.grammarIds) {
      if (!grammarNode.has(gid)) grammarNode.set(gid, seed.id);
    }
  }
  const fallbackNode = nodeSeeds[0]?.id ?? '';

  bundleVocab.forEach((v, i) => {
    cards.push({
      id: `vr-${v.id}`,
      nodeId: v.nodeId,
      type: 'vocab_recognition',
      prompt: 'What does this mean?',
      front: v.spanish,
      back: v.english,
    });

    if (i % 3 === 0) {
      cards.push({
        id: `vp-${v.id}`,
        nodeId: v.nodeId,
        type: 'vocab_production',
        prompt: 'Say it in Spanish without looking.',
        front: v.english,
        back: v.spanish,
      });
    }

    const cloze = i % 2 === 0 ? makeCloze(v.example.target, v.spanish) : null;
    if (cloze) {
      cards.push({
        id: `cz-${v.id}`,
        nodeId: v.nodeId,
        type: 'cloze',
        prompt: 'Fill the gap.',
        front: v.example.native,
        sentence: cloze.sentence,
        back: cloze.answer,
      });
    } else {
      cards.push({
        id: `st-${v.id}`,
        nodeId: v.nodeId,
        type: 'sentence_translation',
        prompt: 'Translate the sentence into Spanish.',
        front: v.example.native,
        back: v.example.target,
      });
    }

    if (v.pos === 'phrase') {
      cards.push({
        id: `ac-${v.id}`,
        nodeId: v.nodeId,
        type: 'audio_comprehension',
        prompt: 'Listen once. Answer from memory. (audio placeholder)',
        front: `[audio] ${v.example.target}`,
        back: v.example.native,
        sentence: v.example.target,
      });
    }

    if (v.example.target.trim().startsWith('¿')) {
      cards.push({
        id: `qa-${v.id}`,
        nodeId: v.nodeId,
        type: 'question_answer',
        prompt: 'What is being asked?',
        front: v.example.target,
        back: v.example.native,
      });
    }
  });

  bundleGrammar.forEach((gp) => {
    const nodeId = grammarNode.get(gp.id) ?? fallbackNode;
    gp.examples.forEach((exItem, j) => {
      cards.push({
        id: `gp-${gp.id}-${j + 1}`,
        nodeId,
        type: 'grammar_pattern',
        prompt: `Pattern: ${gp.pattern}`,
        front: exItem.native,
        back: exItem.target,
        sentence: exItem.target,
      });
    });
  });

  return cards;
}

// ---------------------------------------------------------------------------
// task generation (per level)
// ---------------------------------------------------------------------------

const INPUT_TYPES: InputTaskType[] = ['reading', 'dialogue', 'message', 'sign', 'menu', 'travel', 'listening'];
const OUTPUT_TYPES: OutputTaskType[] = [
  'translate',
  'write_sentence',
  'answer_question',
  'describe',
  'order_food',
  'ask_directions',
  'roleplay',
  'travel_problem',
];

function buildInputTasks(
  nodeSeeds: NodeSeed[],
  nodeVocab: Map<string, VocabItem[]>,
  englishPool: string[],
  spanishPool: string[],
): InputTask[] {
  return nodeSeeds.map((seed, idx) => {
    const items = (nodeVocab.get(seed.id) ?? []).slice(0, 5);
    const type = INPUT_TYPES[idx % INPUT_TYPES.length];
    const text = items.map((v) => v.example.target).join(' ');

    const q0 = items[0];
    const q1 = items[1] ?? items[0];
    const q2 = items[2] ?? items[0];
    const a = withAnswer(q0.english, distractors(englishPool, q0.english, idx + 1, 2), 0);
    const b = withAnswer(q1.english, distractors(englishPool, q1.english, idx + 3, 2), 1);
    const c = withAnswer(q2.spanish, distractors(spanishPool, q2.spanish, idx + 5, 2), 2);

    return {
      id: `in-${seed.id}`,
      nodeId: seed.id,
      title: `${seed.title}: short text`,
      type,
      text,
      coverageEstimate: 85,
      targetVocab: items.map((v) => v.id),
      glossary: items.map((v) => ({ word: v.spanish, meaning: v.english })),
      questions: [
        { id: 'q1', question: `What does "${q0.spanish}" mean?`, ...a },
        { id: 'q2', question: `What does "${q1.spanish}" mean?`, ...b },
        { id: 'q3', question: `Which word means "${q2.english}"?`, ...c },
      ],
    };
  });
}

function outputPrompt(type: OutputTaskType, item: VocabItem, seed: NodeSeed): string {
  switch (type) {
    case 'translate':
      return `Write this in Spanish: "${item.example.native}"`;
    case 'write_sentence':
      return `Write one sentence in Spanish using "${item.spanish}" (${item.english}).`;
    case 'answer_question':
      return `Answer in Spanish in a full sentence: how does "${seed.goal}" apply to you?`;
    case 'describe':
      return `Describe it in Spanish in one or two sentences. Use the word "${item.spanish}".`;
    case 'order_food':
      return 'You are at a café. In Spanish, order something and ask for the bill.';
    case 'ask_directions':
      return 'In Spanish, ask a stranger how to get somewhere and confirm the way.';
    case 'roleplay':
      return `Role-play in Spanish: react to a real situation about ${seed.title.toLowerCase()}.`;
    case 'travel_problem':
      return 'Something has gone wrong (booking, delay or fault). Explain the problem in Spanish and ask for a fix.';
  }
}

function buildOutputTasks(
  nodeSeeds: NodeSeed[],
  nodeVocab: Map<string, VocabItem[]>,
  grammarById: Map<string, GrammarPattern>,
): OutputTask[] {
  return nodeSeeds.map((seed, idx) => {
    const items = nodeVocab.get(seed.id) ?? [];
    const first = items[0];
    const item = items.find((v) => v.pos === 'verb' || v.pos === 'phrase') ?? first;
    const type = OUTPUT_TYPES[idx % OUTPUT_TYPES.length];
    const patterns = seed.grammarIds
      .map((gid) => grammarById.get(gid)?.title)
      .filter((t): t is string => Boolean(t))
      .slice(0, 2);
    const keywords = items.slice(0, 3).map((v) => v.spanish.replace(/[¿?]/g, '').trim());

    return {
      id: `out-${seed.id}`,
      nodeId: seed.id,
      title: `${seed.title}: write`,
      type,
      prompt: outputPrompt(type, item, seed),
      minWords: 4,
      expectedPatterns: patterns,
      targetKeywords: keywords,
      sampleAnswer: item.example.target,
    };
  });
}

// A few richer hand-authored anchor tasks for variety / realism (A1).
const anchorInputTasks: InputTask[] = [
  {
    id: 'in-anchor-cafe',
    nodeId: 'food-order',
    title: 'At the café (dialogue)',
    type: 'dialogue',
    text:
      '— Buenos días. ¿Qué desea? — Quisiera un café con leche y una tostada, por favor. — ¿Algo más? — No, gracias. ¿Cuánto es? — Son tres euros con cincuenta.',
    coverageEstimate: 88,
    targetVocab: [],
    glossary: [
      { word: '¿qué desea?', meaning: 'what would you like?' },
      { word: 'tostada', meaning: 'piece of toast' },
      { word: '¿algo más?', meaning: 'anything else?' },
      { word: '¿cuánto es?', meaning: 'how much is it?' },
    ],
    questions: [
      { id: 'q1', question: 'What does the customer order?', options: ['Coffee with milk and toast', 'Tea and cake', 'Water only'], answerIndex: 0 },
      { id: 'q2', question: 'How much is it?', options: ['3.50 euros', '13 euros', '5 euros'], answerIndex: 0 },
      { id: 'q3', question: 'Does the customer want anything else?', options: ['No', 'Yes, a salad', 'Yes, a coffee'], answerIndex: 0 },
    ],
  },
  {
    id: 'in-anchor-sign',
    nodeId: 'places',
    title: 'Street sign',
    type: 'sign',
    text: 'FARMACIA — Abierto de 9:00 a 14:00 y de 17:00 a 20:00. Cerrado los domingos.',
    coverageEstimate: 82,
    targetVocab: [],
    glossary: [
      { word: 'abierto', meaning: 'open' },
      { word: 'cerrado', meaning: 'closed' },
      { word: 'domingos', meaning: 'Sundays' },
    ],
    questions: [
      { id: 'q1', question: 'What kind of place is this?', options: ['Pharmacy', 'Bank', 'Hotel'], answerIndex: 0 },
      { id: 'q2', question: 'When is it closed?', options: ['Sundays', 'Mornings', 'Never'], answerIndex: 0 },
      { id: 'q3', question: 'Does it open in the afternoon?', options: ['Yes, from 17:00', 'No', 'Only at 14:00'], answerIndex: 0 },
    ],
  },
];

// ---------------------------------------------------------------------------
// assembly
// ---------------------------------------------------------------------------

function buildCourse(): Course {
  const allUnits: Unit[] = [];
  const allNodes: SkillNode[] = [];
  const allGrammar: GrammarPattern[] = [];
  const allVocab: VocabItem[] = [];
  const allFlashcards: Flashcard[] = [];
  const allInputTasks: InputTask[] = [];
  const allOutputTasks: OutputTask[] = [];
  const assessments: Assessment[] = [];
  const levelDefs: CEFRLevelDef[] = [];

  // Global vocab pools for distractors (built up across levels).
  const englishPool: string[] = levelBundles.flatMap((b) => b.vocab.map((v) => v.english));
  const spanishPool: string[] = levelBundles.flatMap((b) => b.vocab.map((v) => v.spanish));

  for (const bundle of levelBundles) {
    // Fill written-pronunciation fields on every item before assembly.
    const bundleVocab = bundle.vocab.map(enrichVocab);

    const nodeVocab = new Map<string, VocabItem[]>();
    for (const v of bundleVocab) {
      const list = nodeVocab.get(v.nodeId) ?? [];
      list.push(v);
      nodeVocab.set(v.nodeId, list);
    }

    const grammarById = new Map(bundle.grammar.map((g) => [g.id, g]));

    const flashcards = buildFlashcards(bundleVocab, bundle.grammar, bundle.nodeSeeds).map(enrichCard);
    const isA1 = bundle.level === 'A1';
    const inputTasks = [
      ...buildInputTasks(bundle.nodeSeeds, nodeVocab, englishPool, spanishPool),
      ...(isA1 ? anchorInputTasks : []),
    ].map(enrichInputTask);
    const outputTasks = buildOutputTasks(bundle.nodeSeeds, nodeVocab, grammarById);

    // reverse-map grammar -> nodes within this level
    const grammarNodes = new Map<string, string[]>();
    for (const seed of bundle.nodeSeeds) {
      for (const gid of seed.grammarIds) {
        const list = grammarNodes.get(gid) ?? [];
        list.push(seed.id);
        grammarNodes.set(gid, list);
      }
    }
    const grammarWithNodes = bundle.grammar.map((g) =>
      enrichGrammar({ ...g, nodeIds: grammarNodes.get(g.id) ?? [] }),
    );

    const unitOrder = new Map(bundle.units.map((u) => [u.id, u.order]));
    const colCounter = new Map<string, number>();

    const nodes: SkillNode[] = bundle.nodeSeeds.map((seed) => {
      const col = colCounter.get(seed.unitId) ?? 0;
      colCounter.set(seed.unitId, col + 1);
      return {
        id: seed.id,
        unitId: seed.unitId,
        title: seed.title,
        goal: seed.goal,
        level: seed.level ?? bundle.level,
        prerequisites: seed.prerequisites,
        grammarIds: seed.grammarIds,
        vocabularyIds: (nodeVocab.get(seed.id) ?? []).map((v) => v.id),
        flashcardIds: flashcards.filter((c) => c.nodeId === seed.id).map((c) => c.id),
        inputTaskIds: inputTasks.filter((t) => t.nodeId === seed.id).map((t) => t.id),
        outputTaskIds: outputTasks.filter((t) => t.nodeId === seed.id).map((t) => t.id),
        position: { col, row: (unitOrder.get(seed.unitId) ?? 1) - 1 },
        critical: seed.critical,
      };
    });

    allUnits.push(...bundle.units);
    allNodes.push(...nodes);
    allGrammar.push(...grammarWithNodes);
    allVocab.push(...bundleVocab);
    allFlashcards.push(...flashcards);
    allInputTasks.push(...inputTasks);
    allOutputTasks.push(...outputTasks);
    assessments.push(enrichAssessment(bundle.assessment));

    levelDefs.push({
      id: bundle.level,
      title: bundle.title,
      description: bundle.description,
      canDoGoals: bundle.canDoGoals,
      unitIds: bundle.units.map((u) => u.id),
      skillNodeIds: bundle.nodeSeeds.map((s) => s.id),
      finalAssessmentId: bundle.assessment.id,
      passRequirements: bundle.assessment.passThresholds,
    });
  }

  return {
    id: 'es-full',
    targetLanguage: 'Spanish',
    nativeLanguage: 'English',
    level: 'A1',
    theme: 'Full CEFR path',
    title: 'Spanish A1–C2 path',
    units: allUnits,
    nodes: allNodes,
    grammar: allGrammar,
    vocab: allVocab,
    flashcards: allFlashcards,
    inputTasks: allInputTasks,
    outputTasks: allOutputTasks,
    levels: levelDefs,
    assessments,
  };
}

export const spanishCourse: Course = buildCourse();

// Helpers used across the app.
export function levelDef(course: Course, level: CEFRLevel): CEFRLevelDef | undefined {
  return course.levels.find((l) => l.id === level);
}

export function assessmentForLevel(course: Course, level: CEFRLevel): Assessment | undefined {
  return course.assessments.find((a) => a.levelId === level);
}

export const courses: Record<string, Course> = { [spanishCourse.id]: spanishCourse };
export const defaultCourse = spanishCourse;
