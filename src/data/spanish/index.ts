import type { CEFRLevel } from '../../types';
import { a1Bundle } from './a1';
import { a2Bundle } from './a2';
import { b1Bundle } from './b1';
import { b2Bundle } from './b2';
import { c1Bundle } from './c1';
import { c2Bundle } from './c2';
import type { LevelBundle } from './types';

// Ordered CEFR ladder. Order matters: progression and placement walk this list.
export const LEVEL_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const levelBundles: LevelBundle[] = [
  a1Bundle,
  a2Bundle,
  b1Bundle,
  b2Bundle,
  c1Bundle,
  c2Bundle,
];

export function levelIndex(level: CEFRLevel): number {
  return LEVEL_ORDER.indexOf(level);
}
