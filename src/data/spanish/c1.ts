import type { Unit } from '../../types';
import { expandVocab, g, mkAssessment, type Raw } from './helpers';
import type { LevelBundle, NodeSeed } from './types';

// C1 — advanced. Nuance, argument, register, professional and abstract topics.
// Roadmap skeleton with real question structure in the assessment.

const units: Unit[] = [
  { id: 'c1u1', order: 17, level: 'C1', title: 'Precision and nuance', goal: 'Choose words precisely and read between the lines.' },
  { id: 'c1u2', order: 18, level: 'C1', title: 'Argument and register', goal: 'Argue, persuade and shift register.' },
];

const nodeSeeds: NodeSeed[] = [
  { id: 'c1-nuance', unitId: 'c1u1', title: 'Word nuance', goal: 'Pick the precise word and catch connotation.', prerequisites: [], grammarIds: ['c1-subjunctive-tenses'] },
  { id: 'c1-abstract', unitId: 'c1u1', title: 'Abstract topics', goal: 'Discuss society, ethics and ideas.', prerequisites: ['c1-nuance'], grammarIds: ['c1-nominalisation'] },
  { id: 'c1-idiomatic', unitId: 'c1u1', title: 'Idiom and figurative use', goal: 'Use idioms and figurative language naturally.', prerequisites: ['c1-nuance'], grammarIds: ['c1-discourse-advanced'] },
  { id: 'c1-argument', unitId: 'c1u2', title: 'Building an argument', goal: 'Build and defend a nuanced argument.', prerequisites: ['c1-abstract'], grammarIds: ['c1-discourse-advanced', 'c1-subjunctive-tenses'], critical: true },
  { id: 'c1-register', unitId: 'c1u2', title: 'Register control', goal: 'Move between formal and informal at will.', prerequisites: ['c1-idiomatic'], grammarIds: ['c1-nominalisation'] },
  { id: 'c1-professional', unitId: 'c1u2', title: 'Professional communication', goal: 'Handle reports, proposals and meetings.', prerequisites: ['c1-argument', 'c1-register'], grammarIds: ['c1-discourse-advanced'], critical: true },
];

const RAW: Record<string, Raw[]> = {
  'c1-nuance': [
    ['matiz', 'nuance', 'noun', 'Hay un matiz importante aquí.', "There's an important nuance here."],
    ['connotación', 'connotation', 'noun', 'Esa palabra tiene connotación negativa.', 'That word has a negative connotation.'],
    ['preciso', 'precise', 'adj', 'Busco el término preciso.', "I'm looking for the precise term."],
    ['ambiguo', 'ambiguous', 'adj', 'La frase es ambigua.', 'The sentence is ambiguous.'],
    ['sutil', 'subtle', 'adj', 'Es una diferencia sutil.', "It's a subtle difference."],
  ],
  'c1-abstract': [
    ['planteamiento', 'approach, framing', 'noun', 'Discrepo del planteamiento.', 'I disagree with the framing.'],
    ['índole', 'nature, kind', 'noun', 'Es un problema de otra índole.', "It's a problem of a different nature."],
    ['ámbito', 'sphere, field', 'noun', 'En el ámbito laboral es distinto.', "In the work sphere it's different."],
    ['repercusión', 'repercussion', 'noun', 'Tendrá repercusiones sociales.', 'It will have social repercussions.'],
    ['debatir', 'to debate', 'verb', 'Debatimos el asunto a fondo.', 'We debated the matter thoroughly.'],
  ],
  'c1-idiomatic': [
    ['dar por sentado', 'to take for granted', 'phrase', 'Lo dio por sentado.', 'He took it for granted.'],
    ['ponerse las pilas', 'to get one’s act together', 'phrase', 'Tienes que ponerte las pilas.', 'You need to get your act together.'],
    ['a fin de cuentas', 'at the end of the day', 'phrase', 'A fin de cuentas, da igual.', "At the end of the day, it doesn't matter."],
    ['echar una mano', 'to lend a hand', 'phrase', '¿Me echas una mano?', 'Can you give me a hand?'],
    ['estar al tanto', 'to be up to date', 'phrase', 'Estoy al tanto del tema.', "I'm up to date on the topic."],
  ],
  'c1-argument': [
    ['sostener', 'to maintain, argue', 'verb', 'Sostengo que es un error.', 'I maintain that it is a mistake.'],
    ['rebatir', 'to refute', 'verb', 'Voy a rebatir ese punto.', "I'll refute that point."],
    ['fundamentar', 'to substantiate', 'verb', 'Debes fundamentar tu opinión.', 'You must back up your opinion.'],
    ['premisa', 'premise', 'noun', 'La premisa es discutible.', 'The premise is debatable.'],
    ['en aras de', 'for the sake of', 'phrase', 'En aras de la claridad, resumo.', "For the sake of clarity, I'll summarise."],
  ],
  'c1-register': [
    ['coloquial', 'colloquial', 'adj', 'Eso es muy coloquial.', "That's very colloquial."],
    ['formal', 'formal', 'adj', 'Use un tono más formal.', 'Use a more formal tone.'],
    ['tutear', 'to address informally', 'verb', '¿Nos tuteamos?', 'Shall we use "tú"?'],
    ['cortés', 'courteous', 'adj', 'Fue muy cortés en la carta.', 'He was very courteous in the letter.'],
    ['jerga', 'jargon, slang', 'noun', 'Evita la jerga técnica.', 'Avoid technical jargon.'],
  ],
  'c1-professional': [
    ['informe', 'report', 'noun', 'Redacté el informe anual.', 'I drafted the annual report.'],
    ['propuesta', 'proposal', 'noun', 'Presentaré una propuesta.', "I'll present a proposal."],
    ['plazo de entrega', 'delivery deadline', 'phrase', 'El plazo de entrega es ajustado.', 'The delivery deadline is tight.'],
    ['acta', 'minutes (of meeting)', 'noun', 'Envío el acta de la reunión.', "I'll send the meeting minutes."],
    ['acordar', 'to agree on', 'verb', 'Acordamos una nueva fecha.', 'We agreed on a new date.'],
  ],
};

const grammar = [
  g('c1-subjunctive-tenses', 'Subjunctive across tenses',
    'Command the imperfect and pluperfect subjunctive and their use after past triggers and in soft assertions.',
    'fuera/fuese · hubiera/hubiese + participle',
    [['Quería que vinieras.', 'I wanted you to come.'], ['Como si nada hubiera pasado.', 'As if nothing had happened.'], ['Ojalá lo hubiera sabido.', 'If only I had known.']],
    'Match the sequence of tenses: a past main verb usually needs a past subjunctive.'),
  g('c1-nominalisation', 'Nominalisation and abstraction',
    'Turn verbs and ideas into nouns to write densely: "el hecho de que", "la falta de".',
    'el hecho de que + subj · la falta de ...',
    [['El hecho de que no venga preocupa.', 'The fact that he is not coming is worrying.'], ['La falta de tiempo lo complica.', 'The lack of time complicates it.'], ['Su negativa sorprendió a todos.', 'His refusal surprised everyone.']],
    '"el hecho de que" normally takes the subjunctive.'),
  g('c1-discourse-advanced', 'Advanced discourse markers',
    'Signal stance and structure: "cabe señalar", "dicho esto", "en última instancia", "por consiguiente".',
    'dicho esto · cabe señalar · por consiguiente',
    [['Dicho esto, hay matices.', 'That said, there are nuances.'], ['Cabe señalar una excepción.', 'It is worth noting an exception.'], ['Por consiguiente, lo rechazo.', 'Consequently, I reject it.']],
    'Vary your connectors; repeating "pero/y" reads as lower level.'),
];

const assessment = mkAssessment('C1', 'C1 final assessment', [
  {
    section: 'vocabulary',
    type: 'vocab_production',
    prompt: 'Rephrase more precisely (one verb): "Dijo que no estaba de acuerdo y dio razones."',
    expectedAnswer: 'Rebatió el argumento.',
    acceptedAnswers: ['rebatio el argumento', 'lo rebatio', 'rebatio'],
    skillNodeIds: ['c1-argument', 'c1-nuance'],
    grammarIds: ['c1-discourse-advanced'],
    difficulty: 5,
    explanation: 'rebatir captures "disagree and give reasons" in one precise verb.',
    feedback: 'Aim for the single precise verb (rebatir).',
  },
  {
    section: 'grammar',
    type: 'cloze',
    prompt: 'Pluperfect subjunctive: "Habló como si no ____ (pasar) nada."',
    expectedAnswer: 'hubiera pasado',
    acceptedAnswers: ['hubiese pasado'],
    skillNodeIds: ['c1-nuance'],
    grammarIds: ['c1-subjunctive-tenses'],
    difficulty: 5,
    explanation: 'como si requires past subjunctive: hubiera/hubiese pasado.',
    feedback: '"como si" + pluperfect subjunctive.',
  },
  {
    section: 'grammar',
    type: 'transformation',
    prompt: 'Nominalise: "Es preocupante que no venga." → Start with "El hecho..."',
    expectedAnswer: 'El hecho de que no venga es preocupante.',
    acceptedAnswers: ['el hecho de que no venga es preocupante'],
    skillNodeIds: ['c1-abstract'],
    grammarIds: ['c1-nominalisation'],
    difficulty: 5,
    explanation: '"el hecho de que" + subjunctive nominalises the clause.',
    feedback: 'Keep the subjunctive after "el hecho de que".',
  },
  {
    section: 'reading',
    type: 'reading_comprehension',
    prompt: 'What is the writer\'s real attitude to the policy, beneath the polite tone?',
    passage:
      'No seré yo quien niegue las buenas intenciones de la medida. Otra cosa es su aplicación: improvisada, mal financiada y, me temo, condenada a repetir los errores de siempre.',
    expectedAnswer: 'Skeptical/critical: good intentions but a poorly executed, likely-to-fail policy',
    acceptedAnswers: ['critical, well-meant but badly executed', 'esceptico, mala aplicacion', 'doubts it will work despite good intentions', 'negative about the execution'],
    skillNodeIds: ['c1-nuance', 'c1-argument'],
    grammarIds: ['c1-discourse-advanced'],
    difficulty: 5,
    explanation: 'Concedes good intentions only to attack the execution — irony/criticism.',
    feedback: 'Read the tone: the concession sets up the criticism.',
  },
  {
    section: 'listening',
    type: 'listening_comprehension',
    prompt: 'From memory: what is the speaker really recommending, and how strongly?',
    passage:
      'Hombre, yo no diría que es imprescindible, pero, francamente, si pudieras posponerlo una semana, nos ahorraríamos más de un disgusto.',
    audioPlaceholder: true,
    expectedAnswer: 'Strongly suggesting (politely) to postpone it by a week to avoid trouble',
    acceptedAnswers: ['postpone a week to avoid problems', 'recomienda posponer una semana', 'suggests delaying one week', 'wants it delayed a week'],
    skillNodeIds: ['c1-register'],
    grammarIds: ['c1-subjunctive-tenses'],
    difficulty: 5,
    explanation: 'Hedged but clear: postpone a week to avoid trouble.',
    feedback: 'The hedging softens a fairly firm recommendation.',
  },
  {
    section: 'writing',
    type: 'writing_response',
    prompt:
      'Write a formal opinion paragraph (8–10 sentences) on whether technology improves education. Concede a counterpoint and refute it.',
    minWords: 90,
    requiredKeywords: ['sin embargo', 'no obstante', 'por consiguiente'],
    requiredPatterns: ['c1-discourse-advanced', 'c1-subjunctive-tenses'],
    skillNodeIds: ['c1-argument', 'c1-professional'],
    grammarIds: ['c1-discourse-advanced'],
    difficulty: 5,
    explanation: 'A C1 argument concedes then refutes, with varied connectors.',
    feedback: 'Concede a real counterpoint, then dismantle it.',
  },
  {
    section: 'speaking',
    type: 'speaking_prompt',
    prompt:
      'Speak for ~2 minutes: defend a position on remote work to a sceptical manager. Adjust to a formal register. Mark complete when done.',
    skillNodeIds: ['c1-professional', 'c1-register'],
    grammarIds: ['c1-discourse-advanced'],
    difficulty: 5,
    explanation: 'Sustain a formal, structured argument under mild pushback.',
    feedback: 'Stay formal and structured for the full two minutes.',
  },
]);

export const c1Bundle: LevelBundle = {
  level: 'C1',
  title: 'C1 — Advanced',
  description:
    'Use the language flexibly and effectively for social, academic and professional purposes. Argue with nuance, control register, and grasp implicit meaning and idiom.',
  canDoGoals: [
    'Argue a nuanced case and refute counterpoints.',
    'Discuss abstract and professional topics fluently.',
    'Control register and use idiom naturally.',
    'Grasp implicit meaning and tone in complex texts.',
  ],
  units,
  nodeSeeds,
  vocab: expandVocab(RAW),
  grammar,
  assessment,
};
