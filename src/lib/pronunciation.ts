import type { CEFRLevel, PronunciationSupport } from '../types';

// Deterministic Spanish pronunciation generator.
//
// Spanish spelling is highly phonetic, so a rule-based engine can produce
// learner-friendly respelling, broad IPA, syllabification, stress and
// targeted warnings for *every* piece of content — no hand-authoring per word.
//
// Output conventions (Part 5):
//   - respelling: hyphenated syllables, CAPITALS on the stressed syllable,
//     vowels kept close to Spanish (ah/eh/ee/oh/oo), e.g. estación -> ehs-tah-SYOHN
//   - ipa: broad *learner* IPA (Latin-American default), e.g. /estaˈsjon/
//   - stress: the stressed syllable, in normal spelling
//   - notes: only the warnings that actually apply to this word (Part 6)

export interface WordPron {
  word: string;
  respelling: string;
  ipa: string;
  syllables: string[];
  stressIndex: number;
  stressSyllable: string;
  notes: string[];
}

export interface Pron {
  /** Learner respelling. Multi-word input is space separated. */
  respelling: string;
  /** Broad IPA wrapped in slashes. */
  ipa: string;
  /** Syllable breakdown in normal spelling (hyphenated; words separated by ·). */
  syllables: string;
  /** Stressed syllable (single words only; '' for phrases). */
  stress: string;
  /** Relevant pronunciation warnings, most important first. */
  notes: string[];
}

// ---------------------------------------------------------------------------
// vowel helpers
// ---------------------------------------------------------------------------

const ACCENT: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' };
const VOWELS = 'aeiouáéíóúü';

const baseVowel = (c: string): string => ACCENT[c] ?? c;
const isVowel = (c: string): boolean => VOWELS.includes(c);
const isAccentedWeak = (c: string): boolean => c === 'í' || c === 'ú';
const isWeak = (c: string): boolean => c === 'i' || c === 'u' || c === 'ü';

/** Two adjacent vowels share a syllable unless an accented weak or two strongs meet. */
function formsDiphthong(a: string, b: string): boolean {
  if (isAccentedWeak(a) || isAccentedWeak(b)) return false;
  if (isWeak(a) || isWeak(b)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// tokenizer — splits a word into vowel / consonant units, keeping digraphs
// (ch, ll, rr, qu, gu+e/i) as single consonant units.
// ---------------------------------------------------------------------------

interface Token {
  text: string;
  vowel: boolean;
}

function tokenize(word: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < word.length) {
    const c = word[i];
    const c2 = word[i + 1] ?? '';
    const pair = c + c2;
    if (pair === 'ch' || pair === 'll' || pair === 'rr' || pair === 'qu') {
      tokens.push({ text: pair, vowel: false });
      i += 2;
      continue;
    }
    // gu + (e/i) -> the u is silent (gue, gui)
    if (c === 'g' && c2 === 'u' && 'eiéí'.includes(word[i + 2] ?? '')) {
      tokens.push({ text: 'gu', vowel: false });
      i += 2;
      continue;
    }
    // gü -> hard g plus a pronounced u glide (güe, güi)
    if (c === 'g' && c2 === 'ü') {
      tokens.push({ text: 'g', vowel: false });
      tokens.push({ text: 'ü', vowel: true });
      i += 2;
      continue;
    }
    if (isVowel(c)) {
      tokens.push({ text: c, vowel: true });
      i += 1;
      continue;
    }
    if (c === 'y') {
      // consonant before a vowel (yo, ya), otherwise a vowel (muy, soy, y)
      tokens.push({ text: 'y', vowel: isVowel(word[i + 1] ?? '') ? false : true });
      i += 1;
      continue;
    }
    tokens.push({ text: c, vowel: false });
    i += 1;
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// syllabification
// ---------------------------------------------------------------------------

const ONSET_L = new Set(['p', 'b', 'c', 'f', 'g', 'k']); // + l
const ONSET_R = new Set(['p', 'b', 'c', 'd', 'f', 'g', 't', 'k']); // + r

function validOnsetCluster(a: string, b: string): boolean {
  if (b === 'l') return ONSET_L.has(a);
  if (b === 'r') return ONSET_R.has(a);
  return false;
}

/** Build syllables as arrays of tokens. */
function syllabify(tokens: Token[]): Token[][] {
  // 1. Group vowels into nuclei (respecting hiatus) and collect consonant runs.
  type Seg = { kind: 'nuc'; toks: Token[] } | { kind: 'cons'; toks: Token[] };
  const segs: Seg[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].vowel) {
      const nuc: Token[] = [tokens[i]];
      i += 1;
      while (i < tokens.length && tokens[i].vowel) {
        const prev = nuc[nuc.length - 1].text;
        if (formsDiphthong(prev, tokens[i].text)) {
          nuc.push(tokens[i]);
          i += 1;
        } else {
          break;
        }
      }
      segs.push({ kind: 'nuc', toks: nuc });
    } else {
      const cons: Token[] = [tokens[i]];
      i += 1;
      while (i < tokens.length && !tokens[i].vowel) {
        cons.push(tokens[i]);
        i += 1;
      }
      segs.push({ kind: 'cons', toks: cons });
    }
  }

  // 2. Walk segments, attaching consonant runs to neighbouring nuclei.
  const syllables: Token[][] = [];
  let pendingOnset: Token[] = [];
  for (let s = 0; s < segs.length; s += 1) {
    const seg = segs[s];
    if (seg.kind === 'cons') {
      const next = segs[s + 1];
      if (!next) {
        // trailing consonants -> coda of the last syllable
        if (syllables.length > 0) syllables[syllables.length - 1].push(...seg.toks);
        else pendingOnset.push(...seg.toks);
        continue;
      }
      const run = seg.toks;
      let leftCount: number;
      if (syllables.length === 0) {
        leftCount = 0; // word-initial consonants are all onset of the first syllable
      } else if (run.length === 1) {
        leftCount = 0;
      } else if (run.length === 2) {
        leftCount = validOnsetCluster(run[0].text, run[1].text) ? 0 : 1;
      } else if (run.length === 3) {
        leftCount = validOnsetCluster(run[1].text, run[2].text) ? 1 : 2;
      } else {
        leftCount = run.length - 2;
      }
      if (leftCount > 0 && syllables.length > 0) {
        syllables[syllables.length - 1].push(...run.slice(0, leftCount));
      }
      pendingOnset.push(...run.slice(leftCount));
    } else {
      syllables.push([...pendingOnset, ...seg.toks]);
      pendingOnset = [];
    }
  }
  if (pendingOnset.length && syllables.length > 0) {
    syllables[syllables.length - 1].push(...pendingOnset);
  }
  return syllables.length ? syllables : tokens.length ? [tokens] : [];
}

// ---------------------------------------------------------------------------
// stress
// ---------------------------------------------------------------------------

function stressIndex(syllables: Token[][], word: string): number {
  const accented = syllables.findIndex((s) => s.some((t) => /[áéíóú]/.test(t.text)));
  if (accented !== -1) return accented;
  if (syllables.length <= 1) return 0;
  const last = word[word.length - 1];
  const endsOpen = isVowel(last) || last === 'n' || last === 's' || last === 'y';
  return endsOpen ? syllables.length - 2 : syllables.length - 1;
}

// ---------------------------------------------------------------------------
// nucleus (vowel cluster) -> sound
// ---------------------------------------------------------------------------

const SINGLE: Record<string, { resp: string; ipa: string }> = {
  a: { resp: 'ah', ipa: 'a' },
  e: { resp: 'eh', ipa: 'e' },
  i: { resp: 'ee', ipa: 'i' },
  o: { resp: 'oh', ipa: 'o' },
  u: { resp: 'oo', ipa: 'u' },
  y: { resp: 'ee', ipa: 'i' },
};

const DIPH: Record<string, { resp: string; ipa: string }> = {
  ia: { resp: 'yah', ipa: 'ja' },
  ie: { resp: 'yeh', ipa: 'je' },
  io: { resp: 'yoh', ipa: 'jo' },
  iu: { resp: 'yoo', ipa: 'ju' },
  ua: { resp: 'wah', ipa: 'wa' },
  ue: { resp: 'weh', ipa: 'we' },
  ui: { resp: 'wee', ipa: 'wi' },
  uo: { resp: 'woh', ipa: 'wo' },
  ai: { resp: 'eye', ipa: 'ai' },
  au: { resp: 'ow', ipa: 'au' },
  ei: { resp: 'ay', ipa: 'ei' },
  eu: { resp: 'eh-oo', ipa: 'eu' },
  oi: { resp: 'oy', ipa: 'oi' },
  ou: { resp: 'oh', ipa: 'ou' },
};

function singleVowel(c: string): { resp: string; ipa: string } {
  return SINGLE[baseVowel(c)] ?? { resp: '', ipa: '' };
}

function glide(c: string): { resp: string; ipa: string } {
  return baseVowel(c) === 'i' || c === 'y' ? { resp: 'y', ipa: 'j' } : { resp: 'w', ipa: 'w' };
}

function convertNucleus(vs: string[]): { resp: string; ipa: string } {
  if (vs.length === 1) return singleVowel(vs[0]);
  if (vs.length === 2) {
    const key = (baseVowel(vs[0]) === 'y' ? 'i' : baseVowel(vs[0])) + (baseVowel(vs[1]) === 'y' ? 'i' : baseVowel(vs[1]));
    if (DIPH[key]) return DIPH[key];
    // rising fallback (glide + vowel)
    if (isWeak(vs[0])) {
      const g = glide(vs[0]);
      const v = singleVowel(vs[1]);
      return { resp: g.resp + v.resp, ipa: g.ipa + v.ipa };
    }
    const v = singleVowel(vs[0]);
    const g = glide(vs[1]);
    return { resp: v.resp + g.resp, ipa: v.ipa + g.ipa };
  }
  // triphthong: glide + (vowel + offglide)
  const g = glide(vs[0]);
  const rest = convertNucleus(vs.slice(1));
  return { resp: g.resp + rest.resp, ipa: g.ipa + rest.ipa };
}

// ---------------------------------------------------------------------------
// consonant -> sound (with limited context)
// ---------------------------------------------------------------------------

function softFollows(next: string): boolean {
  const b = baseVowel(next);
  return b === 'e' || b === 'i';
}

function convertConsonant(
  text: string,
  next: string,
  prev: string,
  wordStart: boolean,
): { resp: string; ipa: string } {
  switch (text) {
    case 'ch':
      return { resp: 'ch', ipa: 'tʃ' };
    case 'll':
      return { resp: 'y', ipa: 'ʝ' };
    case 'rr':
      return { resp: 'rr', ipa: 'r' };
    case 'qu':
      return { resp: 'k', ipa: 'k' };
    case 'gu':
      return { resp: 'g', ipa: 'g' };
    case 'b':
    case 'v':
      return { resp: 'b', ipa: 'b' };
    case 'c':
      return softFollows(next) ? { resp: 's', ipa: 's' } : { resp: 'k', ipa: 'k' };
    case 'd':
      return { resp: 'd', ipa: 'd' };
    case 'f':
      return { resp: 'f', ipa: 'f' };
    case 'g':
      return softFollows(next) ? { resp: 'h', ipa: 'x' } : { resp: 'g', ipa: 'g' };
    case 'h':
      return { resp: '', ipa: '' };
    case 'j':
      return { resp: 'h', ipa: 'x' };
    case 'k':
      return { resp: 'k', ipa: 'k' };
    case 'l':
      return { resp: 'l', ipa: 'l' };
    case 'm':
      return { resp: 'm', ipa: 'm' };
    case 'n':
      return { resp: 'n', ipa: 'n' };
    case 'ñ':
      return { resp: 'ny', ipa: 'ɲ' };
    case 'p':
      return { resp: 'p', ipa: 'p' };
    case 'q':
      return { resp: 'k', ipa: 'k' };
    case 'r': {
      // initial r and r after n/l/s is trilled; respelling keeps a single r
      const trill = wordStart || prev === 'n' || prev === 'l' || prev === 's';
      return { resp: 'r', ipa: trill ? 'r' : 'ɾ' };
    }
    case 's':
      return { resp: 's', ipa: 's' };
    case 't':
      return { resp: 't', ipa: 't' };
    case 'w':
      return { resp: 'w', ipa: 'w' };
    case 'x':
      return { resp: 'ks', ipa: 'ks' };
    case 'y':
      return { resp: 'y', ipa: 'ʝ' };
    case 'z':
      return { resp: 's', ipa: 's' };
    default:
      return { resp: text, ipa: text };
  }
}

// ---------------------------------------------------------------------------
// warnings (Part 6) — only what applies to this word
// ---------------------------------------------------------------------------

function wordNotes(word: string): string[] {
  const notes: string[] = [];
  const w = word.toLowerCase();
  const has = (re: RegExp) => re.test(w);

  // A silent h is any h that is not part of the digraph "ch".
  if (/h/.test(w.replace(/ch/g, ''))) notes.push('The h is silent — do not pronounce it.');

  if (has(/j/) || has(/g[eiéí]/)) notes.push('j and soft g are a throaty h (further back than the English h).');
  if (has(/ll/)) notes.push('ll sounds like a y here, not an English double-l.');
  if (has(/ñ/)) notes.push("ñ is 'ny', as in canyon.");
  if (has(/rr/) || has(/^r/)) notes.push('This r is rolled (trilled), not the English r.');
  else if (has(/r/)) notes.push('r is a single quick tap, not the English r.');
  if (has(/v/)) notes.push('v sounds almost like a soft b in Spanish.');
  if (has(/z/) || has(/c[eiéí]/)) notes.push('z and c before e/i are an s sound (Latin American).');

  return notes;
}

// ---------------------------------------------------------------------------
// public API
// ---------------------------------------------------------------------------

const STRIP = /^[¿¡"“”'`(«]+|[.,;:!?"“”'`)»…]+$/g;

export function pronounceWord(rawWord: string): WordPron | null {
  const word = rawWord.toLowerCase().replace(STRIP, '').trim();
  if (!word || !/[a-záéíóúüñ]/i.test(word)) return null;

  const tokens = tokenize(word);
  const syllables = syllabify(tokens);
  const sIdx = stressIndex(syllables, word);
  const multi = syllables.length > 1;

  const sylStrings: string[] = [];
  const respSylls: string[] = [];
  const ipaSylls: string[] = [];

  let lastLetter = '';
  let started = false;

  syllables.forEach((syl, si) => {
    sylStrings.push(syl.map((t) => t.text).join(''));

    const firstVowel = syl.findIndex((t) => t.vowel);
    const onset = firstVowel === -1 ? syl.filter((t) => !t.vowel) : syl.slice(0, firstVowel);
    let rest = firstVowel === -1 ? [] : syl.slice(firstVowel);
    const nucleus: Token[] = [];
    while (rest.length && rest[0].vowel) {
      nucleus.push(rest[0]);
      rest = rest.slice(1);
    }
    const coda = rest;

    let resp = '';
    let ipa = '';

    onset.forEach((t, k) => {
      const next = k + 1 < onset.length ? onset[k + 1].text[0] : (nucleus[0]?.text[0] ?? '');
      const c = convertConsonant(t.text, next, lastLetter, !started);
      resp += c.resp;
      ipa += c.ipa;
      started = true;
      lastLetter = t.text[t.text.length - 1];
    });

    if (nucleus.length) {
      const n = convertNucleus(nucleus.map((t) => t.text));
      resp += n.resp;
      ipa += n.ipa;
      started = true;
      lastLetter = nucleus[nucleus.length - 1].text;
    }

    coda.forEach((t, k) => {
      const next = k + 1 < coda.length ? coda[k + 1].text[0] : '';
      const c = convertConsonant(t.text, next, lastLetter, false);
      resp += c.resp;
      ipa += c.ipa;
      started = true;
      lastLetter = t.text[t.text.length - 1];
    });

    respSylls.push(multi && si === sIdx ? resp.toUpperCase() : resp);
    ipaSylls.push(ipa);
  });

  const ipa = ipaSylls.map((s, i) => (multi && i === sIdx ? `ˈ${s}` : s)).join('');

  return {
    word,
    respelling: respSylls.filter(Boolean).join('-'),
    ipa,
    syllables: sylStrings,
    stressIndex: sIdx,
    stressSyllable: sylStrings[sIdx] ?? '',
    notes: wordNotes(word),
  };
}

/** Pronounce a word, phrase or sentence. */
export function pronounce(text: string): Pron {
  const rawTokens = text.split(/\s+/).filter(Boolean);
  const words = rawTokens
    .map((t) => pronounceWord(t))
    .filter((w): w is WordPron => Boolean(w));

  if (words.length === 0) {
    return { respelling: '', ipa: '', syllables: '', stress: '', notes: [] };
  }

  const respelling = words.map((w) => w.respelling).join(' ');
  const ipa = `/${words.map((w) => w.ipa).join(' ')}/`;
  const syllables = words.map((w) => w.syllables.join('-')).join(' · ');

  // Dedupe notes across the phrase, keeping priority order.
  const seen = new Set<string>();
  const notes: string[] = [];
  for (const w of words) {
    for (const n of w.notes) {
      if (!seen.has(n)) {
        seen.add(n);
        notes.push(n);
      }
    }
  }

  const single = words.length === 1 ? words[0] : null;
  const stress =
    single && single.syllables.length > 1
      ? `stress on "${single.stressSyllable}"`
      : '';

  return { respelling, ipa, syllables, stress, notes };
}

/** Compact "word → respelling" hint used in lists and repair tips. */
export function pronHint(text: string): string {
  const p = pronounce(text);
  return p.respelling;
}

/**
 * Resolve the effective support level. An explicit user choice wins; otherwise
 * default to Full for beginners (A1/A2) and Basic for B1+ (Part 7).
 */
export function resolveSupport(
  explicit: PronunciationSupport | undefined,
  level: CEFRLevel,
): PronunciationSupport {
  if (explicit) return explicit;
  return level === 'A1' || level === 'A2' ? 'full' : 'basic';
}

/** Default support set at onboarding, based on the placement level. */
export function defaultSupport(level: CEFRLevel): PronunciationSupport {
  return level === 'A1' || level === 'A2' ? 'full' : 'basic';
}
