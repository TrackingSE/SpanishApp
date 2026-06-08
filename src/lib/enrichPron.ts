import type {
  Assessment,
  Flashcard,
  GrammarPattern,
  InputTask,
  VocabItem,
} from '../types';
import { pronounce, pronounceWord } from './pronunciation';

// Enrichment layer: takes authored content and fills the written-pronunciation
// fields using the deterministic generator. Runs once at course-build time, so
// authors never hand-write pronunciation and no field for A1/A2 is left empty.

const MAX_NOTES = 2;

function isSingleWord(text: string): boolean {
  return text.trim().split(/\s+/).length === 1;
}

function bareStress(text: string): string {
  if (!isSingleWord(text)) return '';
  return pronounceWord(text)?.stressSyllable ?? '';
}

export function enrichVocab(v: VocabItem): VocabItem {
  const word = pronounce(v.spanish);
  const example = pronounce(v.example.target);
  return {
    ...v,
    pronunciation: word.respelling,
    ipa: word.ipa,
    syllables: word.syllables,
    stress: bareStress(v.spanish),
    pronunciationNotes: word.notes.slice(0, MAX_NOTES),
    examplePronunciation: example.respelling,
    exampleIpa: example.ipa,
    example: {
      ...v.example,
      pronunciation: example.respelling,
      ipa: example.ipa,
      stressNotes: example.notes[0],
    },
  };
}

function cardSpanish(card: Flashcard): string {
  switch (card.type) {
    case 'vocab_recognition':
      return card.front;
    case 'vocab_production':
      return card.back;
    case 'cloze':
      return card.sentence ? card.sentence.replace('____', card.back) : card.back;
    case 'sentence_translation':
      return card.back;
    case 'audio_comprehension':
      return card.sentence ?? card.front;
    case 'grammar_pattern':
      return card.sentence ?? card.back;
    case 'question_answer':
      return card.front;
    default:
      return card.back;
  }
}

export function enrichCard(card: Flashcard): Flashcard {
  // audio placeholders prefix the front with "[audio] " — strip it for sound.
  const spanish = cardSpanish(card).replace(/^\[audio\]\s*/, '');
  const p = pronounce(spanish);
  return {
    ...card,
    pronunciation: p.respelling,
    ipa: p.ipa,
    pronunciationHint: p.respelling,
    showPronunciationAfterAnswer: true,
  };
}

export function enrichGrammar(g: GrammarPattern): GrammarPattern {
  return {
    ...g,
    examples: g.examples.map((ex) => {
      const p = pronounce(ex.target);
      return { ...ex, pronunciation: p.respelling, ipa: p.ipa, stressNotes: p.notes[0] };
    }),
  };
}

/** Spanish answers live in the vocabulary and grammar sections. */
function answerIsSpanish(section: string): boolean {
  return section === 'vocabulary' || section === 'grammar';
}

export function enrichAssessment(a: Assessment): Assessment {
  return {
    ...a,
    questions: a.questions.map((q) => {
      if (!q.expectedAnswer || !answerIsSpanish(q.section)) return q;
      const p = pronounce(q.expectedAnswer);
      return {
        ...q,
        expectedAnswerPronunciation: p.respelling,
        pronunciationHint: p.ipa,
        pronunciationFocus: p.notes[0],
      };
    }),
  };
}

function splitLines(text: string): string[] {
  // Split on dialogue dashes first, then into sentences (no lookbehind, for
  // broad browser support). Punctuation stays attached to each sentence.
  const lines: string[] = [];
  for (const chunk of text.split(/\s+—\s+/)) {
    const parts = chunk.match(/[^.!?]+[.!?]*/g);
    if (parts) lines.push(...parts.map((s) => s.trim()).filter(Boolean));
    else if (chunk.trim()) lines.push(chunk.trim());
  }
  return lines.filter(Boolean);
}

export function enrichInputTask(t: InputTask): InputTask {
  const lines = splitLines(t.text);
  const textWithPronunciation = lines.map((line) => {
    const p = pronounce(line);
    return { line, pronunciation: p.respelling, ipa: p.ipa };
  });

  // Collect tricky words (those that triggered a warning) for drilling.
  const seen = new Set<string>();
  const points: string[] = [];
  const notes = new Set<string>();
  for (const word of t.text.split(/\s+/)) {
    const w = pronounceWord(word);
    if (!w) continue;
    w.notes.forEach((n) => notes.add(n));
    if (w.notes.length > 0 && !seen.has(w.word) && points.length < 6) {
      seen.add(w.word);
      points.push(`${w.word} → ${w.respelling}`);
    }
  }

  return {
    ...t,
    textWithPronunciation,
    pronunciationNotes: [...notes].slice(0, 3),
    targetPronunciationPoints: points,
  };
}
