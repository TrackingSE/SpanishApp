import type { Unit } from '../types';
import type { NodeSeed } from './spanish/types';

// A1: 8 units, 40 skill nodes. Nodes are authored without positions / derived
// id lists; buildCourse fills vocabularyIds, flashcardIds, task ids and layout.

export type { NodeSeed };

export const units: Unit[] = [
  { id: 'u1', order: 1, level: 'A1', title: 'First contact', goal: 'Open and close a basic conversation.' },
  { id: 'u2', order: 2, level: 'A1', title: 'Survival basics', goal: 'Handle numbers, time and dates.' },
  { id: 'u3', order: 3, level: 'A1', title: 'Personal information', goal: 'Talk about yourself and family.' },
  { id: 'u4', order: 4, level: 'A1', title: 'Food and drink', goal: 'Order, pay and state preferences.' },
  { id: 'u5', order: 5, level: 'A1', title: 'Places and directions', goal: 'Find your way and use transport.' },
  { id: 'u6', order: 6, level: 'A1', title: 'Daily life', goal: 'Describe routines and simple plans.' },
  { id: 'u7', order: 7, level: 'A1', title: 'Shopping and problems', goal: 'Buy things and ask for help.' },
  { id: 'u8', order: 8, level: 'A1', title: 'A1 consolidation', goal: 'Put it together in real situations.' },
];

export const nodeSeeds: NodeSeed[] = [
  // Unit 1 — First contact
  { id: 'greetings', unitId: 'u1', title: 'Greetings', goal: 'Greet someone and say goodbye.', prerequisites: [], grammarIds: ['subject-pronouns'], critical: true },
  { id: 'names', unitId: 'u1', title: 'Names', goal: 'Say and ask names.', prerequisites: ['greetings'], grammarIds: ['llamarse', 'question-words'] },
  { id: 'nationality', unitId: 'u1', title: 'Nationality', goal: 'Say where you are from.', prerequisites: ['names'], grammarIds: ['ser', 'question-words'] },
  { id: 'politeness', unitId: 'u1', title: 'Basic politeness', goal: 'Use please, thanks and sorry.', prerequisites: ['greetings'], grammarIds: ['polite-requests', 'negation'] },
  { id: 'alphabet', unitId: 'u1', title: 'Alphabet and spelling', goal: 'Spell your name out loud.', prerequisites: ['names'], grammarIds: ['question-words'] },

  // Unit 2 — Survival basics
  { id: 'yesno', unitId: 'u2', title: 'Yes, no and basics', goal: 'Answer yes / no and react.', prerequisites: ['politeness'], grammarIds: ['negation', 'word-order'] },
  { id: 'numbers', unitId: 'u2', title: 'Numbers 0 to 100', goal: 'Count and read numbers.', prerequisites: ['yesno'], grammarIds: ['numbers-agreement'], critical: true },
  { id: 'days-dates', unitId: 'u2', title: 'Days and dates', goal: 'Say the day and date.', prerequisites: ['numbers'], grammarIds: ['definite-articles', 'numbers-agreement'] },
  { id: 'time', unitId: 'u2', title: 'Telling time', goal: 'Ask and tell the time.', prerequisites: ['numbers'], grammarIds: ['telling-time', 'ser'] },
  { id: 'prices', unitId: 'u2', title: 'Prices', goal: 'Understand and ask prices.', prerequisites: ['numbers'], grammarIds: ['numbers-agreement', 'querer'] },

  // Unit 3 — Personal information
  { id: 'age', unitId: 'u3', title: 'Age', goal: 'Say how old you are.', prerequisites: ['numbers', 'nationality'], grammarIds: ['tener'] },
  { id: 'jobs', unitId: 'u3', title: 'Jobs', goal: 'Say what you do for work.', prerequisites: ['age'], grammarIds: ['ser', 'indefinite-articles'] },
  { id: 'family', unitId: 'u3', title: 'Family', goal: 'Name family members.', prerequisites: ['age'], grammarIds: ['tener', 'possessives'] },
  { id: 'where-you-live', unitId: 'u3', title: 'Where you live', goal: 'Say where you live.', prerequisites: ['nationality'], grammarIds: ['estar', 'ser-vs-estar', 'prep-location'] },
  { id: 'descriptions', unitId: 'u3', title: 'Basic descriptions', goal: 'Describe people and things.', prerequisites: ['family'], grammarIds: ['ser', 'adjective-agreement', 'gender'] },

  // Unit 4 — Food and drink
  { id: 'coffee', unitId: 'u4', title: 'Ordering coffee', goal: 'Order a drink at a café.', prerequisites: ['politeness', 'numbers'], grammarIds: ['querer', 'polite-requests'] },
  { id: 'food-order', unitId: 'u4', title: 'Ordering food', goal: 'Order a meal.', prerequisites: ['coffee'], grammarIds: ['querer', 'indefinite-articles'] },
  { id: 'likes', unitId: 'u4', title: 'Likes and dislikes', goal: 'Say what you like.', prerequisites: ['food-order'], grammarIds: ['gustar'] },
  { id: 'allergies', unitId: 'u4', title: 'Allergies and preferences', goal: 'State what you cannot eat.', prerequisites: ['food-order'], grammarIds: ['gustar', 'negation', 'poder'] },
  { id: 'paying', unitId: 'u4', title: 'Paying the bill', goal: 'Ask for and pay the bill.', prerequisites: ['food-order', 'prices'], grammarIds: ['querer', 'poder', 'numbers-agreement'] },

  // Unit 5 — Places and directions
  { id: 'places', unitId: 'u5', title: 'Common places', goal: 'Name places in a town.', prerequisites: ['where-you-live'], grammarIds: ['hay', 'definite-articles'] },
  { id: 'asking-where', unitId: 'u5', title: 'Asking where', goal: 'Ask where something is.', prerequisites: ['places'], grammarIds: ['estar', 'question-words', 'prep-location'] },
  { id: 'directions', unitId: 'u5', title: 'Directions', goal: 'Give and follow directions.', prerequisites: ['asking-where'], grammarIds: ['ir', 'prep-location'] },
  { id: 'transport', unitId: 'u5', title: 'Transport', goal: 'Use transport words.', prerequisites: ['places'], grammarIds: ['ir', 'prep-location'] },
  { id: 'tickets', unitId: 'u5', title: 'Buying tickets', goal: 'Buy a ticket.', prerequisites: ['transport', 'prices'], grammarIds: ['querer', 'numbers-agreement', 'ir'] },

  // Unit 6 — Daily life
  { id: 'routines', unitId: 'u6', title: 'Daily routine', goal: 'Describe your day.', prerequisites: ['time'], grammarIds: ['ar-verbs', 'frequency-adverbs'] },
  { id: 'common-verbs', unitId: 'u6', title: 'Common verbs', goal: 'Use everyday verbs.', prerequisites: ['descriptions'], grammarIds: ['ar-verbs', 'er-verbs', 'ir-verbs'] },
  { id: 'present-ar', unitId: 'u6', title: 'Regular -ar verbs', goal: 'Conjugate -ar verbs in present.', prerequisites: ['common-verbs'], grammarIds: ['ar-verbs', 'present-basics'], critical: true },
  { id: 'frequency', unitId: 'u6', title: 'Frequency words', goal: 'Say how often you do things.', prerequisites: ['routines'], grammarIds: ['frequency-adverbs', 'word-order'] },
  { id: 'plans', unitId: 'u6', title: 'Simple plans', goal: 'Say what you are going to do.', prerequisites: ['present-ar'], grammarIds: ['ir-a-inf', 'ir'] },

  // Unit 7 — Shopping and problems
  { id: 'clothes', unitId: 'u7', title: 'Clothes and sizes', goal: 'Ask for a size.', prerequisites: ['prices'], grammarIds: ['demonstratives', 'adjective-agreement', 'plurals'] },
  { id: 'asking-help', unitId: 'u7', title: 'Asking for help', goal: 'Ask someone for help.', prerequisites: ['politeness'], grammarIds: ['poder', 'polite-requests', 'necesitar'] },
  { id: 'problems', unitId: 'u7', title: 'Returns and problems', goal: 'Report a problem.', prerequisites: ['asking-help', 'clothes'], grammarIds: ['necesitar', 'negation', 'poder'] },
  { id: 'hotel', unitId: 'u7', title: 'Hotel basics', goal: 'Check in to a hotel.', prerequisites: ['numbers', 'politeness'], grammarIds: ['querer', 'hay', 'numbers-agreement'] },
  { id: 'emergencies', unitId: 'u7', title: 'Emergency phrases', goal: 'Ask for help in an emergency.', prerequisites: ['asking-help'], grammarIds: ['necesitar', 'poder', 'question-words'] },

  // Unit 8 — A1 consolidation
  { id: 'mixed-listening', unitId: 'u8', title: 'Mixed listening', goal: 'Follow short spoken exchanges.', prerequisites: ['time', 'directions'], grammarIds: ['question-words', 'present-basics'] },
  { id: 'mixed-reading', unitId: 'u8', title: 'Mixed reading', goal: 'Read short everyday texts.', prerequisites: ['food-order', 'places'], grammarIds: ['connectors', 'present-basics'] },
  { id: 'short-writing', unitId: 'u8', title: 'Short writing', goal: 'Write a few connected sentences.', prerequisites: ['present-ar', 'descriptions'], grammarIds: ['connectors', 'word-order', 'present-basics'] },
  { id: 'speaking-prompts', unitId: 'u8', title: 'Speaking prompts', goal: 'Answer common spoken questions.', prerequisites: ['likes', 'family'], grammarIds: ['gustar', 'ser', 'tener'] },
  { id: 'final-scenario', unitId: 'u8', title: 'Final travel scenario', goal: 'Handle a full travel situation.', prerequisites: ['paying', 'tickets', 'hotel', 'directions'], grammarIds: ['querer', 'ir-a-inf', 'poder', 'prep-location'] },
];
