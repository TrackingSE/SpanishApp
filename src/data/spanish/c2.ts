import type { Unit } from '../../types';
import { expandVocab, g, mkAssessment, type Raw } from './helpers';
import type { LevelBundle, NodeSeed } from './types';

// C2 — mastery. Precision, idiom, register, speed and complex texts.
// Roadmap skeleton with real question structure in the assessment.

const units: Unit[] = [
  { id: 'c2u1', order: 19, level: 'C2', title: 'Mastery and precision', goal: 'Near-native precision, idiom and register.' },
  { id: 'c2u2', order: 20, level: 'C2', title: 'Speed and complexity', goal: 'Handle dense texts and fast speech effortlessly.' },
];

const nodeSeeds: NodeSeed[] = [
  { id: 'c2-precision', unitId: 'c2u1', title: 'Surgical precision', goal: 'Say exactly what you mean, no more, no less.', prerequisites: [], grammarIds: ['c2-fine-grammar'] },
  { id: 'c2-idiom', unitId: 'c2u1', title: 'Idiom and culture', goal: 'Use idiom, humour and cultural reference naturally.', prerequisites: ['c2-precision'], grammarIds: ['c2-stylistics'] },
  { id: 'c2-register', unitId: 'c2u1', title: 'Register mastery', goal: 'Shift register seamlessly and appropriately.', prerequisites: ['c2-precision'], grammarIds: ['c2-stylistics'] },
  { id: 'c2-complex-texts', unitId: 'c2u2', title: 'Complex texts', goal: 'Read dense, specialised or literary texts with ease.', prerequisites: ['c2-idiom'], grammarIds: ['c2-fine-grammar'], critical: true },
  { id: 'c2-speed', unitId: 'c2u2', title: 'Speed and fluency', goal: 'Follow and produce fast, spontaneous speech.', prerequisites: ['c2-register', 'c2-complex-texts'], grammarIds: ['c2-stylistics'], critical: true },
];

const RAW: Record<string, Raw[]> = {
  'c2-precision': [
    ['salvedad', 'caveat, exception', 'noun', 'Con una salvedad importante.', 'With one important caveat.'],
    ['matizar', 'to qualify, nuance', 'verb', 'Permítame matizar lo dicho.', 'Allow me to qualify what I said.'],
    ['en rigor', 'strictly speaking', 'phrase', 'En rigor, no es exacto.', 'Strictly speaking, it is not exact.'],
    ['discernir', 'to discern', 'verb', 'Hay que discernir lo esencial.', 'One must discern the essential.'],
  ],
  'c2-idiom': [
    ['no tener desperdicio', 'to be excellent throughout', 'phrase', 'El discurso no tuvo desperdicio.', 'The speech was excellent from start to finish.'],
    ['a buenas horas', 'too little too late', 'phrase', 'A buenas horas lo dices.', 'Now you tell me (too late).'],
    ['llover sobre mojado', 'to add insult to injury', 'phrase', 'Esto es llover sobre mojado.', 'This is just one more thing on top of everything.'],
    ['de buenas a primeras', 'out of the blue', 'phrase', 'De buenas a primeras, se marchó.', 'Out of the blue, he left.'],
  ],
  'c2-register': [
    ['acaso', 'perchance, by any chance', 'adv', '¿Acaso lo dudas?', 'Do you, by any chance, doubt it?'],
    ['huelga decir', 'needless to say', 'phrase', 'Huelga decir que acepto.', 'Needless to say, I accept.'],
    ['en lo sucesivo', 'henceforth', 'phrase', 'En lo sucesivo, se aplicará.', 'Henceforth, it will apply.'],
    ['a tenor de', 'in line with', 'phrase', 'A tenor de lo expuesto...', 'In line with what has been set out...'],
  ],
  'c2-complex-texts': [
    ['soslayar', 'to sidestep', 'verb', 'No conviene soslayar el tema.', 'It is not wise to sidestep the issue.'],
    ['ínclito', 'illustrious (literary)', 'adj', 'El ínclito autor lo afirma.', 'The illustrious author affirms it.'],
    ['allende', 'beyond', 'prep', 'Allende los mares.', 'Beyond the seas.'],
    ['otrora', 'formerly, once', 'adv', 'La otrora gran potencia.', 'The once-great power.'],
  ],
  'c2-speed': [
    ['a bote pronto', 'off the top of my head', 'phrase', 'A bote pronto, diría que sí.', "Off the top of my head, I'd say yes."],
    ['sobre la marcha', 'on the fly', 'phrase', 'Lo decidimos sobre la marcha.', 'We decided it on the fly.'],
    ['en un santiamén', 'in no time', 'phrase', 'Lo resolvió en un santiamén.', 'He solved it in no time.'],
    ['ni que decir tiene', 'it goes without saying', 'phrase', 'Ni que decir tiene que vendré.', 'It goes without saying that I will come.'],
  ],
};

const grammar = [
  g('c2-fine-grammar', 'Fine-grained grammar',
    'Control rare and tricky structures: future subjunctive remnants, complex relative clauses, and concessive forms.',
    'por más que + subj · quienquiera que · sea cual sea',
    [['Por más que insistas, no iré.', 'However much you insist, I will not go.'], ['Sea cual sea el motivo, no importa.', "Whatever the reason, it doesn't matter."], ['Quienquiera que llame, no estoy.', "Whoever calls, I'm not in."]],
    'Concessive clauses (por más que, sea cual sea) take the subjunctive.'),
  g('c2-stylistics', 'Stylistics and rhythm',
    'Vary sentence length, use inversion and ellipsis, and place emphasis for rhetorical effect.',
    'fronting · ellipsis · rhetorical inversion',
    [['Mucho me temo que no.', "I'm very much afraid not."], ['De eso, ni hablar.', 'No way, out of the question.'], ['Tarde llegaste, pero llegaste.', 'Late you came, but you came.']],
    'Native-like rhythm comes from varying structure, not just from harder words.'),
];

const assessment = mkAssessment('C2', 'C2 final assessment', [
  {
    section: 'vocabulary',
    type: 'vocab_production',
    prompt: 'Replace the underlined part with one precise word: "Quiero <añadir una pequeña excepción> a lo dicho."',
    expectedAnswer: 'matizar',
    acceptedAnswers: ['quiero matizar lo dicho', 'matizar'],
    skillNodeIds: ['c2-precision'],
    grammarIds: ['c2-fine-grammar'],
    difficulty: 5,
    explanation: 'matizar = to add nuance / a qualification to something said.',
    feedback: 'The precise verb is matizar.',
  },
  {
    section: 'grammar',
    type: 'cloze',
    prompt: 'Concessive subjunctive: "Por más que ____ (insistir, tú), no cambiaré de idea."',
    expectedAnswer: 'insistas',
    skillNodeIds: ['c2-complex-texts'],
    grammarIds: ['c2-fine-grammar'],
    difficulty: 5,
    explanation: 'por más que takes the subjunctive: insistir → insistas.',
    feedback: '"Por más que" + subjunctive (insistas).',
  },
  {
    section: 'grammar',
    type: 'transformation',
    prompt: 'Make it emphatic by fronting: "No iré de ninguna manera." → start with "De ninguna manera..."',
    expectedAnswer: 'De ninguna manera iré.',
    acceptedAnswers: ['de ninguna manera ire'],
    skillNodeIds: ['c2-speed'],
    grammarIds: ['c2-stylistics'],
    difficulty: 5,
    explanation: 'Fronting the negative phrase triggers verb inversion for emphasis.',
    feedback: 'Front the phrase and invert the verb.',
  },
  {
    section: 'reading',
    type: 'reading_comprehension',
    prompt: 'Summarise the writer\'s thesis in one sentence, capturing the irony.',
    passage:
      'Celebramos la transparencia con la misma fe con que, no hace tanto, celebrábamos el secreto: convencidos, en ambos casos, de que la virtud residía en el método y no en quienes lo manejan.',
    expectedAnswer: 'We fetishise transparency just as we once fetishised secrecy, mistaking the method for the morality of those who wield it',
    acceptedAnswers: ['we worship transparency like we once worshipped secrecy, confusing method with the people', 'transparency is a new dogma like secrecy was, virtue is in people not method', 'transparency is the new faith, but virtue lies in people not the method'],
    skillNodeIds: ['c2-complex-texts'],
    grammarIds: ['c2-stylistics'],
    difficulty: 5,
    explanation: 'Irony: both transparency and secrecy were treated as inherent virtues; the writer says virtue lies in people, not methods.',
    feedback: 'Capture the parallel and the irony, not just the topic.',
  },
  {
    section: 'listening',
    type: 'listening_comprehension',
    prompt: 'From memory: what is the speaker\'s attitude, and what do they imply without stating?',
    passage:
      'Que conste que yo no he dicho nada. Pero, si yo fuera quien decide, ciertas personas llevarían ya tiempo buscándose la vida en otra empresa.',
    audioPlaceholder: true,
    expectedAnswer: 'Implies certain people should have been fired already, while pretending not to take a position',
    acceptedAnswers: ['hints some people should be fired but denies saying so', 'implies firing certain people, off the record', 'thinks some should be sacked, stays deniable', 'would have fired some people already'],
    skillNodeIds: ['c2-speed', 'c2-register'],
    grammarIds: ['c2-fine-grammar'],
    difficulty: 5,
    explanation: 'Deniable insinuation: would have removed certain people; disclaims it with "yo no he dicho nada".',
    feedback: 'The meaning is in the implication, not the literal words.',
  },
  {
    section: 'writing',
    type: 'writing_response',
    prompt:
      'Write a polished 10–12 sentence opinion piece on whether social media strengthens or erodes public debate. Use varied register and at least one idiom.',
    minWords: 120,
    requiredKeywords: ['no obstante', 'en definitiva'],
    requiredPatterns: ['c2-stylistics', 'c2-fine-grammar'],
    skillNodeIds: ['c2-complex-texts', 'c2-precision'],
    grammarIds: ['c2-stylistics'],
    difficulty: 5,
    explanation: 'Mastery shows in rhythm, precision and controlled register.',
    feedback: 'Vary your structures; precision over big words.',
  },
  {
    section: 'speaking',
    type: 'speaking_prompt',
    prompt:
      'Speak for ~3 minutes: improvise a balanced argument on a topic you draw at random. Handle interruptions and idiom. Mark complete when done.',
    skillNodeIds: ['c2-speed', 'c2-register'],
    grammarIds: ['c2-stylistics'],
    difficulty: 5,
    explanation: 'Spontaneity, idiom and register control under time pressure.',
    feedback: 'Improvise fluently; sound natural, not rehearsed.',
  },
]);

export const c2Bundle: LevelBundle = {
  level: 'C2',
  title: 'C2 — Mastery',
  description:
    'Understand virtually everything and express yourself with precision, idiom and appropriate register at natural speed, including in complex and literary texts.',
  canDoGoals: [
    'Express fine shades of meaning precisely.',
    'Use idiom, humour and register like a native.',
    'Read dense, specialised and literary texts with ease.',
    'Follow and produce fast, spontaneous speech.',
  ],
  units,
  nodeSeeds,
  vocab: expandVocab(RAW),
  grammar,
  assessment,
};
