// Speech support (Phase 1).
//
// Wraps two browser Web Speech APIs so the rest of the app never touches them
// directly:
//   - speechSynthesis (text-to-speech) — gives the app a Spanish voice, so
//     cards, listening texts and assessment audio can actually be heard.
//   - SpeechRecognition (speech-to-text) — captures a spoken answer so the
//     speaking task can score real production instead of self-attestation.
//
// Both APIs are optional. Every export degrades gracefully: callers check the
// `is*Supported()` helpers and hide the feature when the browser lacks it.

const SPANISH_LANG = 'es-ES';

// ---------------------------------------------------------------------------
// text-to-speech
// ---------------------------------------------------------------------------

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let cachedVoice: SpeechSynthesisVoice | null = null;

/**
 * Best available Spanish voice. Voices load asynchronously in most browsers,
 * so this may return null on the first call and a real voice soon after; we
 * cache the first Spanish voice we find.
 */
export function getSpanishVoice(): SpeechSynthesisVoice | null {
  if (!isTTSSupported()) return null;
  if (cachedVoice) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const spanish = voices.filter((v) => v.lang.toLowerCase().startsWith('es'));
  if (spanish.length === 0) return null;

  // Prefer Castilian, then Latin-American, then any Spanish voice.
  const preferred =
    spanish.find((v) => v.lang.toLowerCase() === 'es-es') ??
    spanish.find((v) => /es-(mx|us|la|419)/i.test(v.lang)) ??
    spanish[0];

  cachedVoice = preferred;
  return preferred;
}

/**
 * Warm up the voice list. Browsers populate voices lazily and fire
 * `voiceschanged` once they are ready; call this once on app start.
 */
export function primeVoices(): void {
  if (!isTTSSupported()) return;
  getSpanishVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = null;
    getSpanishVoice();
  });
}

export interface SpeakOptions {
  /** 0.1–10, default 0.9 (a touch slower than native for learners). */
  rate?: number;
  /** Called when speech ends or is cancelled. */
  onEnd?: () => void;
}

/**
 * Speak Spanish text aloud. Cancels any in-progress utterance first so rapid
 * taps do not queue up. No-op when TTS is unsupported.
 */
export function speakSpanish(text: string, opts: SpeakOptions = {}): void {
  if (!isTTSSupported() || !text.trim()) {
    opts.onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(stripBrackets(text));
  const voice = getSpanishVoice();
  if (voice) utter.voice = voice;
  utter.lang = voice?.lang ?? SPANISH_LANG;
  utter.rate = opts.rate ?? 0.9;
  if (opts.onEnd) {
    utter.onend = () => opts.onEnd?.();
    utter.onerror = () => opts.onEnd?.();
  }
  synth.speak(utter);
}

export function cancelSpeech(): void {
  if (isTTSSupported()) window.speechSynthesis.cancel();
}

/** Remove editorial markers like a leading "[audio]" tag before speaking. */
function stripBrackets(text: string): string {
  return text.replace(/\[[^\]]*\]/g, '').trim();
}

// ---------------------------------------------------------------------------
// speech recognition
// ---------------------------------------------------------------------------

// Minimal typings — SpeechRecognition is not in the standard DOM lib.
interface SpeechRecognitionResultLike {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export interface RecognitionResult {
  transcript: string;
  confidence: number;
}

export interface RecognitionHandle {
  /** Stop listening early; the pending promise still resolves/rejects. */
  stop: () => void;
}

/**
 * Listen once for a Spanish utterance. Resolves with the best transcript, or
 * rejects with a short error code ('unsupported' | 'no-speech' | 'not-allowed'
 * | the raw error). The returned handle lets the caller stop early.
 */
export function listenSpanish(
  onDone: (result: RecognitionResult) => void,
  onError: (error: string) => void,
): RecognitionHandle {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    onError('unsupported');
    return { stop: () => {} };
  }

  const rec = new Ctor();
  rec.lang = SPANISH_LANG;
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  let settled = false;

  rec.onresult = (e) => {
    const best = e.results?.[0]?.[0];
    if (best && !settled) {
      settled = true;
      onDone({ transcript: best.transcript ?? '', confidence: best.confidence ?? 0 });
    }
  };
  rec.onerror = (e) => {
    if (!settled) {
      settled = true;
      onError(e.error || 'error');
    }
  };
  rec.onend = () => {
    if (!settled) {
      settled = true;
      onError('no-speech');
    }
  };

  try {
    rec.start();
  } catch {
    if (!settled) {
      settled = true;
      onError('error');
    }
  }

  return { stop: () => rec.stop() };
}

// ---------------------------------------------------------------------------
// scoring
// ---------------------------------------------------------------------------

export interface SpeechScore {
  /** 0–100 overall match between what was said and the target. */
  score: number;
  transcript: string;
  matched: string[];
  missing: string[];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // drop accents
    .replace(/[¿?¡!.,;:"'—-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s: string): string[] {
  const n = normalize(s);
  return n ? n.split(' ') : [];
}

/** Levenshtein edit distance between two short strings. */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** 0–1 similarity for a single word pair. */
function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - editDistance(a, b) / maxLen;
}

/**
 * Compare a spoken transcript against the target Spanish text. A word counts
 * as matched when the transcript contains it exactly or a close phonetic
 * near-miss (edit-distance similarity ≥ 0.8, to forgive small recognizer
 * slips). The score blends word coverage (70%) with whole-string similarity
 * (30%), so both "said the right words" and "said them in order" matter.
 */
export function scoreSpeech(target: string, transcript: string): SpeechScore {
  const targetTokens = tokens(target);
  const saidTokens = tokens(transcript);

  if (targetTokens.length === 0) {
    return { score: 0, transcript, matched: [], missing: [] };
  }

  const matched: string[] = [];
  const missing: string[] = [];
  const saidPool = [...saidTokens];

  for (const t of targetTokens) {
    const idx = saidPool.findIndex((s) => s === t || wordSimilarity(s, t) >= 0.8);
    if (idx !== -1) {
      matched.push(t);
      saidPool.splice(idx, 1); // consume, so repeats are not double-counted
    } else {
      missing.push(t);
    }
  }

  const coverage = matched.length / targetTokens.length;
  const stringSim = wordSimilarity(normalize(target), normalize(transcript));
  const score = Math.round(100 * (coverage * 0.7 + stringSim * 0.3));

  return { score: Math.max(0, Math.min(100, score)), transcript, matched, missing };
}
