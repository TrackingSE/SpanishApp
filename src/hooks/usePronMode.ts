import { useAppStore } from '../store/useAppStore';
import { computeLevels } from '../lib/levels';
import { resolveSupport } from '../lib/pronunciation';
import type { PronunciationSupport } from '../types';

/** Resolve the effective pronunciation support level from profile + current level. */
export function usePronMode(): PronunciationSupport {
  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);
  const explicit = state.profile?.pronunciationSupport;
  const { currentLevel } = computeLevels(course, state);
  return resolveSupport(explicit, currentLevel);
}
