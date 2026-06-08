import type { AppState } from '../types';

// Persistence abstraction. Today this is localStorage; the interface is kept
// narrow (load / save) so it can be swapped for IndexedDB later without
// touching the store or UI.

const STORAGE_KEY = 'linguamap.state.v1';
export const STATE_VERSION = 1;

export const emptyState: AppState = {
  version: STATE_VERSION,
  profile: null,
  cards: {},
  nodes: {},
  stats: {},
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return structuredClone(emptyState);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(emptyState);
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || typeof parsed !== 'object') return structuredClone(emptyState);
    // Shallow migration guard: ensure required buckets exist.
    return {
      version: STATE_VERSION,
      profile: parsed.profile ?? null,
      cards: parsed.cards ?? {},
      nodes: parsed.nodes ?? {},
      stats: parsed.stats ?? {},
    };
  } catch {
    return structuredClone(emptyState);
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — fail silently for the MVP.
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
