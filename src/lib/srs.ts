import type { CardProgress, Rating } from '../types';
import { addDays } from './date';

// Spaced-retrieval scheduler — an SM-2 inspired, simplified algorithm.
// Each answer updates the interval, ease factor and due date, and records the
// rating in a small rolling window used to compute review accuracy.

const MIN_EASE = 1.3;
const RECENT_WINDOW = 8;

export function createCardProgress(cardId: string, ref: Date = new Date()): CardProgress {
  return {
    cardId,
    due: ref.toISOString(),
    interval: 0,
    ease: 2.5,
    reps: 0,
    lapses: 0,
    lastReviewed: null,
    recent: [],
  };
}

/** A rating counts as "correct" for accuracy purposes when it is Good or Easy. */
export function isCorrect(rating: Rating): boolean {
  return rating === 'good' || rating === 'easy';
}

export function schedule(
  prev: CardProgress,
  rating: Rating,
  ref: Date = new Date(),
): CardProgress {
  let { interval, ease, reps, lapses } = prev;

  switch (rating) {
    case 'again': {
      lapses += 1;
      reps = 0;
      interval = 0; // relearn: due again immediately (same session / next day)
      ease = Math.max(MIN_EASE, ease - 0.2);
      break;
    }
    case 'hard': {
      reps += 1;
      ease = Math.max(MIN_EASE, ease - 0.15);
      interval = interval <= 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
      break;
    }
    case 'good': {
      reps += 1;
      if (interval <= 0) interval = 1;
      else if (interval === 1) interval = 3;
      else interval = Math.round(interval * ease);
      break;
    }
    case 'easy': {
      reps += 1;
      ease = ease + 0.15;
      if (interval <= 0) interval = 2;
      else if (interval === 1) interval = 5;
      else interval = Math.round(interval * ease * 1.3);
      break;
    }
  }

  // For "again" we keep it due in ~10 minutes so it reappears this session.
  const due =
    rating === 'again'
      ? new Date(ref.getTime() + 10 * 60 * 1000)
      : addDays(ref, Math.max(1, interval));

  const recent = [...prev.recent, rating].slice(-RECENT_WINDOW);

  return {
    ...prev,
    interval,
    ease,
    reps,
    lapses,
    lastReviewed: ref.toISOString(),
    due: due.toISOString(),
    recent,
  };
}

/** Rolling review accuracy (0-100) for a set of cards. */
export function accuracyFromRatings(ratings: Rating[]): number {
  if (ratings.length === 0) return 0;
  const correct = ratings.filter(isCorrect).length;
  return Math.round((correct / ratings.length) * 100);
}

/**
 * Card-level mastery estimate (0-100).
 *
 * Weighted mostly toward recent correctness and the number of successful reps
 * so that a focused study session produces meaningful, visible progress. The
 * SRS interval still contributes a smaller "long-term retention" bonus, but it
 * does not dominate — otherwise mastery could never climb without waiting real
 * calendar days for intervals to grow.
 */
export function cardMastery(p: CardProgress): number {
  if (p.reps === 0 && p.recent.length === 0) return 0;
  const recentScore = p.recent.length
    ? p.recent.filter(isCorrect).length / p.recent.length
    : 0;
  const repsScore = Math.min(1, p.reps / 4); // saturates after ~4 good reps
  const intervalScore = Math.min(1, p.interval / 21); // long-term bonus
  return Math.round((recentScore * 0.65 + repsScore * 0.25 + intervalScore * 0.1) * 100);
}
