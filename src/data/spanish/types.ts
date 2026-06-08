import type { Assessment, CEFRLevel, GrammarPattern, Unit, VocabItem } from '../../types';

// Authoring seed for a skill node. buildCourse fills positions and the derived
// id lists (vocabulary / flashcards / tasks).
export interface NodeSeed {
  id: string;
  unitId: string;
  title: string;
  goal: string;
  prerequisites: string[];
  grammarIds: string[];
  /** Defaults to the bundle level when omitted. */
  level?: CEFRLevel;
  /** Critical skills must clear the criticalSkillMin floor to pass the level. */
  critical?: boolean;
}

// Everything needed to assemble one CEFR level.
export interface LevelBundle {
  level: CEFRLevel;
  title: string;
  description: string;
  canDoGoals: string[];
  units: Unit[];
  nodeSeeds: NodeSeed[];
  vocab: VocabItem[];
  grammar: GrammarPattern[];
  assessment: Assessment;
}
