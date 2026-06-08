import { units as a1Units, nodeSeeds as a1NodeSeeds } from '../units';
import { grammar as a1Grammar } from '../grammar';
import { vocab as a1Vocab } from '../vocab';
import { mkAssessment } from './helpers';
import type { LevelBundle } from './types';

// A1 keeps the existing expanded content and gains a real final assessment.

const assessment = mkAssessment('A1', 'A1 final assessment', [
  // Vocabulary — production, not recognition.
  {
    section: 'vocabulary',
    type: 'vocab_production',
    prompt: 'Write the Spanish for: "I would like a coffee with milk, please."',
    expectedAnswer: 'Quisiera un café con leche, por favor.',
    acceptedAnswers: ['quiero un cafe con leche por favor', 'quisiera un cafe con leche por favor'],
    skillNodeIds: ['coffee'],
    grammarIds: ['querer', 'polite-requests'],
    difficulty: 3,
    explanation: 'quisiera is softer than quiero; café con leche is the set phrase.',
    feedback: 'Order drinks with quisiera/quiero + the item + por favor.',
  },
  {
    section: 'vocabulary',
    type: 'sentence_completion',
    prompt: 'Complete: "Tengo treinta ____." (I am thirty years old.)',
    expectedAnswer: 'años',
    acceptedAnswers: ['anos'],
    skillNodeIds: ['age'],
    grammarIds: ['tener'],
    difficulty: 2,
    explanation: 'Age uses tener + número + años, never ser.',
    feedback: 'Age is "tener ... años", literally "to have ... years".',
  },
  {
    section: 'vocabulary',
    type: 'vocab_production',
    prompt: 'Write in Spanish: "Where is the train station?"',
    expectedAnswer: '¿Dónde está la estación de tren?',
    acceptedAnswers: ['donde esta la estacion de tren', 'donde esta la estacion'],
    skillNodeIds: ['asking-where', 'transport'],
    grammarIds: ['estar', 'question-words'],
    difficulty: 3,
    explanation: 'Location uses estar, and questions open with ¿.',
    feedback: 'Use estar for location: ¿Dónde está...?',
  },
  // Grammar — cloze, correction, transformation, error spotting.
  {
    section: 'grammar',
    type: 'cloze',
    prompt: 'Fill the gap with ser or estar: "El restaurante ____ cerrado hoy."',
    expectedAnswer: 'está',
    acceptedAnswers: ['esta'],
    skillNodeIds: ['where-you-live'],
    grammarIds: ['ser-vs-estar', 'estar'],
    difficulty: 3,
    explanation: 'A temporary state (closed today) takes estar.',
    feedback: 'Closed/open is a state, so estar, not ser.',
  },
  {
    section: 'grammar',
    type: 'sentence_correction',
    prompt: 'Correct the error: "Yo tengo veinte años y soy de canada."',
    expectedAnswer: 'Yo tengo veinte años y soy de Canadá.',
    acceptedAnswers: ['tengo veinte anos y soy de canada', 'yo tengo veinte anos y soy de canada'],
    skillNodeIds: ['nationality', 'age'],
    grammarIds: ['ser'],
    difficulty: 3,
    explanation: 'Country names are capitalised: Canadá.',
    feedback: 'Watch capital letters on country names.',
  },
  {
    section: 'grammar',
    type: 'transformation',
    prompt: 'Make it plural: "La manzana roja." → ?',
    expectedAnswer: 'Las manzanas rojas.',
    acceptedAnswers: ['las manzanas rojas'],
    skillNodeIds: ['descriptions'],
    grammarIds: ['adjective-agreement', 'plurals'],
    difficulty: 3,
    explanation: 'Article, noun and adjective all become plural and keep gender.',
    feedback: 'Plural agreement runs across article + noun + adjective.',
  },
  {
    section: 'grammar',
    type: 'error_spotting',
    prompt: 'One word is wrong. Rewrite correctly: "Me gusta los gatos."',
    expectedAnswer: 'Me gustan los gatos.',
    acceptedAnswers: ['me gustan los gatos'],
    skillNodeIds: ['likes'],
    grammarIds: ['gustar'],
    difficulty: 4,
    explanation: 'With a plural thing liked, gustar becomes gustan.',
    feedback: 'gustar agrees with the thing liked: plural → gustan.',
  },
  // Reading — short realistic text, inference required.
  {
    section: 'reading',
    type: 'reading_comprehension',
    prompt: 'Why can the customer NOT eat the dish as written?',
    passage:
      'Nota del cliente: "Quiero la ensalada, pero soy alérgico a los frutos secos. ¿Puede prepararla sin nueces, por favor?"',
    expectedAnswer: 'He is allergic to nuts',
    acceptedAnswers: ['allergic to nuts', 'nut allergy', 'es alergico a los frutos secos', 'allergic'],
    skillNodeIds: ['allergies'],
    grammarIds: ['gustar', 'poder'],
    difficulty: 3,
    explanation: 'frutos secos / nueces = nuts; the customer asks for it without them.',
    feedback: 'The key word is alérgico (allergic) + nueces (nuts).',
  },
  {
    section: 'reading',
    type: 'reading_comprehension',
    prompt: 'On which days and at what time does the pharmacy close in the afternoon?',
    passage:
      'FARMACIA — Abierto de lunes a viernes de 9:00 a 14:00 y de 17:00 a 20:30. Sábados solo por la mañana. Domingos cerrado.',
    expectedAnswer: '20:30 on weekdays',
    acceptedAnswers: ['20:30', '8:30 pm', 'monday to friday at 20:30', 'de lunes a viernes a las 20:30'],
    skillNodeIds: ['places'],
    grammarIds: ['hay', 'definite-articles'],
    difficulty: 3,
    explanation: 'Afternoon hours (17:00–20:30) only apply Monday–Friday.',
    feedback: 'Saturdays are mornings only, so afternoon close is a weekday detail.',
  },
  // Listening — audio placeholder, answer from memory.
  {
    section: 'listening',
    type: 'listening_comprehension',
    prompt: 'You hear this once. How much is the total, and what did they order?',
    passage:
      '— Para mí, un café y una tostada. — Yo quiero un zumo de naranja. — Muy bien, son cuatro euros con veinte.',
    audioPlaceholder: true,
    expectedAnswer: '4.20 euros, a coffee, a toast and an orange juice',
    acceptedAnswers: ['4.20', '4,20', 'cuatro euros con veinte', '4 euros 20'],
    skillNodeIds: ['mixed-listening', 'paying'],
    grammarIds: ['numbers-agreement'],
    difficulty: 4,
    explanation: 'cuatro euros con veinte = 4.20.',
    feedback: 'Catch the price said as "cuatro euros con veinte".',
  },
  {
    section: 'listening',
    type: 'listening_comprehension',
    prompt: 'From memory: where does the speaker tell you to turn, and is it near or far?',
    passage:
      'Siga todo recto, luego gire a la derecha en el segundo semáforo. Está muy cerca, a dos minutos.',
    audioPlaceholder: true,
    expectedAnswer: 'turn right at the second traffic light; it is near',
    acceptedAnswers: ['right at the second traffic light', 'gire a la derecha', 'right, near', 'turn right near'],
    skillNodeIds: ['directions'],
    grammarIds: ['ir', 'prep-location'],
    difficulty: 4,
    explanation: 'a la derecha = right; muy cerca = very near.',
    feedback: 'Direction = derecha (right); distance = cerca (near).',
  },
  // Writing — rule-based scoring.
  {
    section: 'writing',
    type: 'writing_response',
    prompt:
      'Write 3–4 sentences introducing yourself: your name, where you are from, your age and one thing you like.',
    minWords: 20,
    requiredKeywords: ['soy', 'me llamo', 'tengo', 'gusta'],
    requiredPatterns: ['ser', 'tener', 'gustar'],
    skillNodeIds: ['names', 'nationality', 'age', 'likes'],
    grammarIds: ['ser', 'tener', 'gustar'],
    difficulty: 3,
    explanation: 'A full intro uses me llamo / soy de / tengo ... años / me gusta.',
    feedback: 'Cover all four: name, origin, age, and a like.',
  },
  // Speaking — placeholder.
  {
    section: 'speaking',
    type: 'speaking_prompt',
    prompt:
      'Speak aloud for ~30 seconds: order a coffee and a snack, ask the price, and pay. Mark complete when done.',
    skillNodeIds: ['coffee', 'paying'],
    grammarIds: ['querer', 'polite-requests'],
    difficulty: 3,
    explanation: 'Chain: greeting → order → ¿cuánto es? → pay.',
    feedback: 'Say it out loud before marking complete.',
  },
]);

export const a1Bundle: LevelBundle = {
  level: 'A1',
  title: 'A1 — Beginner',
  description:
    'Survive simple, predictable situations. Greet people, give basic personal details, order food, ask prices and directions using set phrases.',
  canDoGoals: [
    'Introduce yourself and give basic personal information.',
    'Order food and drink and pay.',
    'Ask for and follow simple directions.',
    'Handle numbers, time, dates and prices.',
  ],
  units: a1Units,
  nodeSeeds: a1NodeSeeds,
  vocab: a1Vocab,
  grammar: a1Grammar,
  assessment,
};
