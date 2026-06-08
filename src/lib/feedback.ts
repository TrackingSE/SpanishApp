import type { OutputTask } from '../types';
import { THRESHOLDS } from './adaptive';

export interface OutputFeedback {
  score: number; // 0-100 production score
  passed: boolean;
  wordCount: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  positives: string[];
  suggestions: string[];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents for lenient matching
    .replace(/[¿?¡!.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Rule-based MVP feedback: rewards length, keyword coverage and basic
 * sentence formatting. No grammar engine yet — this is intentionally simple
 * and deterministic, ready to be swapped for a model-based grader later.
 */
export function evaluateOutput(task: OutputTask, raw: string): OutputFeedback {
  const text = raw.trim();
  const words = text ? text.split(/\s+/) : [];
  const wordCount = words.length;
  const normalized = ` ${normalize(text)} `;

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  for (const kw of task.targetKeywords) {
    if (normalized.includes(` ${normalize(kw)} `) || normalized.includes(normalize(kw))) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const positives: string[] = [];
  const suggestions: string[] = [];

  // Length component (0-35).
  const lengthRatio = task.minWords > 0 ? Math.min(1, wordCount / task.minWords) : 1;
  const lengthScore = Math.round(lengthRatio * 35);
  if (wordCount >= task.minWords) positives.push(`Length is fine (${wordCount} words).`);
  else suggestions.push(`Write more. Aim for at least ${task.minWords} words.`);

  // Keyword component (0-50).
  const kwRatio = task.targetKeywords.length
    ? matchedKeywords.length / task.targetKeywords.length
    : 1;
  const keywordScore = Math.round(kwRatio * 50);
  if (matchedKeywords.length) {
    positives.push(`Used key phrases: ${matchedKeywords.join(', ')}.`);
  }
  if (missingKeywords.length) {
    suggestions.push(`Try to include: ${missingKeywords.join(', ')}.`);
  }

  // Formatting component (0-15).
  let formatScore = 0;
  const startsCapital = /^[¿¡]?[A-ZÁÉÍÓÚÑ]/.test(text);
  const endsPunct = /[.!?]$/.test(text);
  if (startsCapital) formatScore += 7;
  else suggestions.push('Start your sentence with a capital letter.');
  if (endsPunct) formatScore += 8;
  else suggestions.push('End your sentence with punctuation (. ! ?).');
  if (startsCapital && endsPunct) positives.push('Capitalization and punctuation are fine.');

  const score = Math.max(0, Math.min(100, lengthScore + keywordScore + formatScore));
  const passed = score >= THRESHOLDS.passOutput;

  if (passed) positives.push('Meets the bar for A1.');
  else suggestions.push('Not enough yet. Revise and resubmit.');

  return {
    score,
    passed,
    wordCount,
    matchedKeywords,
    missingKeywords,
    positives,
    suggestions,
  };
}
