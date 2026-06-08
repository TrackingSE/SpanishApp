import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { pronounce } from '../lib/pronunciation';

// Built-in Spanish pronunciation guide for English speakers (Part 3).
// Practical, plain voice, field-notebook style. Drills are generated from the
// same engine that powers pronunciation everywhere else in the app.

const VOWELS: { v: string; like: string }[] = [
  { v: 'a', like: 'like "ah" in father' },
  { v: 'e', like: 'like a short "eh" in bed' },
  { v: 'i', like: 'like "ee" in see' },
  { v: 'o', like: 'like "oh" in note, but shorter' },
  { v: 'u', like: 'like "oo" in food' },
];

const LETTERS: { l: string; note: string }[] = [
  { l: 'j', note: 'a strong h, made at the back of the throat (like the ch in loch).' },
  { l: 'h', note: 'silent. Never pronounced: hola is "OH-lah".' },
  { l: 'ñ', note: 'ny, as in canyon: año is "AH-nyoh".' },
  { l: 'll', note: 'usually a y sound in learner Spanish: llamo is "YAH-moh".' },
  { l: 'r', note: 'a single quick tap of the tongue, not the English r.' },
  { l: 'rr', note: 'a rolled / trilled r. The r at the start of a word is also rolled.' },
  { l: 'v / b', note: 'almost the same sound — both a soft b.' },
  { l: 'z, c (before e/i)', note: 'an s sound in Latin America (a th sound in much of Spain).' },
];

const WARNINGS = [
  'Do not pronounce the Spanish e like English "ee". It is a short "eh".',
  'Do not pronounce the h in hola.',
  'Do not pronounce ll as an English double-l.',
  'Do not pronounce every Spanish r as the English r.',
  'Do not stretch Spanish vowels — keep them short and clean.',
  'Do not reduce unstressed vowels to a lazy "uh" (schwa).',
];

const MINIMAL_PAIRS: [string, string][] = [
  ['pero', 'perro'],
  ['caro', 'carro'],
  ['casa', 'caza'],
  ['solo', 'sólo'],
];

const DRILL_WORDS = ['hola', 'gracias', 'estación', 'izquierda', 'restaurante', 'habitación', 'señor', 'jueves'];

export function Pronunciation() {
  const [drill, setDrill] = useState(0);
  const [showSay, setShowSay] = useState(false);
  const word = DRILL_WORDS[drill % DRILL_WORDS.length];
  const p = pronounce(word);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Pronunciation guide"
        subtitle="How Spanish actually sounds — built for English speakers. Default: clear Latin-American style."
      />

      {/* 1. Vowels */}
      <section className="card p-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900">1. The five vowels</h2>
        <p className="mt-1 text-sm text-ink-600">
          Spanish has five short, stable vowels. They do not glide or change like English vowels.
        </p>
        <ul className="mt-4 divide-y divide-ink-200">
          {VOWELS.map(({ v, like }) => (
            <li key={v} className="flex items-baseline gap-4 py-2">
              <span className="font-serif text-2xl font-semibold text-ink-900">{v}</span>
              <span className="text-sm text-ink-700">{like}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex gap-2 text-sm text-ink-700">
          <span className="tag tag-rust shrink-0">watch out</span>
          <span>Keep vowels short and pure. Do not turn them into English-style diphthongs.</span>
        </p>
      </section>

      {/* 2. Stress */}
      <section className="mt-6 card p-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900">2. Stress rules</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-700">
          <li className="flex gap-2">
            <span className="tag tag-ink shrink-0">1</span>
            <span>Words ending in a vowel, <strong>n</strong> or <strong>s</strong> are usually stressed on the second-to-last syllable. <em>casa → CA-sa.</em></span>
          </li>
          <li className="flex gap-2">
            <span className="tag tag-ink shrink-0">2</span>
            <span>Words ending in any other consonant are usually stressed on the last syllable. <em>hotel → o-TEL.</em></span>
          </li>
          <li className="flex gap-2">
            <span className="tag tag-ink shrink-0">3</span>
            <span>A written accent marks the exception and always wins. <em>estación → es-ta-CIÓN.</em></span>
          </li>
        </ul>
      </section>

      {/* 3. Tricky letters */}
      <section className="mt-6 card p-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900">
          3. Letters that confuse English speakers
        </h2>
        <ul className="mt-3 divide-y divide-ink-200">
          {LETTERS.map(({ l, note }) => (
            <li key={l} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
              <span className="w-32 shrink-0 font-mono text-sm font-semibold text-ochre-700">{l}</span>
              <span className="text-sm text-ink-700">{note}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* common mistakes */}
      <section className="mt-6 card p-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900">Common mistakes to avoid</h2>
        <ul className="mt-3 space-y-1.5">
          {WARNINGS.map((w, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink-700">
              <span className="text-rust-500">✕</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Regional note */}
      <section className="mt-6 card p-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900">4. A note on region</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          This app defaults to a clear, learner-friendly Latin-American style. The main differences
          you might hear elsewhere: in much of Spain, <strong>z</strong> and <strong>c</strong> before
          e/i are a "th" sound, and <strong>ll</strong> can sound more like "j". Do not overthink this
          as a beginner — pick one and stay consistent.
        </p>
      </section>

      {/* 5. Practice drills */}
      <section className="mt-6 card p-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900">5. Practice drills</h2>

        <div className="mt-4 border border-ink-200 bg-paper p-4">
          <h3 className="label">Repeat after me · syllable tapping</h3>
          <p className="mt-3 font-serif text-3xl font-semibold text-ink-900">{word}</p>
          <p className="mt-1 font-mono text-sm tracking-wide text-ochre-700">{p.respelling}</p>
          <p className="font-mono text-[12px] text-ink-400">{p.ipa}</p>
          <p className="mt-1 font-mono text-[12px] text-ink-500">
            tap each syllable: {p.syllables.split('-').join(' · ')}
          </p>
          {showSay && p.notes.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {p.notes.map((n, i) => (
                <li key={i} className="flex gap-1.5 text-[12px] text-ink-600">
                  <span className="text-rust-500">!</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setShowSay((v) => !v)} className="btn-secondary">
              {showSay ? 'Hide notes' : 'Show notes'}
            </button>
            <button
              onClick={() => {
                setDrill((d) => d + 1);
                setShowSay(false);
              }}
              className="btn-primary"
            >
              Next word
            </button>
          </div>
          <p className="mt-3 font-mono text-[11px] text-ink-400">
            (audio is not recorded yet — read the respelling aloud, then check the notes)
          </p>
        </div>

        <div className="mt-4 border border-ink-200 bg-paper p-4">
          <h3 className="label">Minimal pairs — hear the difference</h3>
          <p className="mt-1 text-sm text-ink-600">
            Same except one sound. Say both slowly; the rolled rr and the s/z contrasts matter.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {MINIMAL_PAIRS.map(([a, b]) => {
              const pa = pronounce(a);
              const pb = pronounce(b);
              return (
                <div key={a} className="flex items-center justify-between border border-ink-200 px-3 py-2">
                  <div>
                    <span className="font-medium text-ink-900">{a}</span>
                    <span className="ml-2 font-mono text-[11px] text-ochre-700">{pa.respelling}</span>
                  </div>
                  <span className="font-mono text-ink-300">vs</span>
                  <div className="text-right">
                    <span className="font-medium text-ink-900">{b}</span>
                    <span className="ml-2 font-mono text-[11px] text-ochre-700">{pb.respelling}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 border border-ink-200 bg-paper p-4">
          <h3 className="label">Find the stress</h3>
          <p className="mt-1 text-sm text-ink-600">
            The CAPITAL syllable in any respelling in this app is the stressed one. Read it louder and
            a touch longer — everything else stays short and even.
          </p>
        </div>
      </section>
    </div>
  );
}
