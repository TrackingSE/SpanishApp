import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { getDueCards } from '../lib/today';
import { isDue } from '../lib/date';
import type { CardType, Flashcard, Rating } from '../types';

const TYPE_LABEL: Record<CardType, string> = {
  vocab_recognition: 'recognition',
  vocab_production: 'production',
  cloze: 'cloze',
  sentence_translation: 'translation',
  audio_comprehension: 'listening',
  grammar_pattern: 'pattern',
  question_answer: 'q & a',
};

const TYPED_TYPES: CardType[] = ['vocab_production', 'cloze', 'sentence_translation', 'grammar_pattern'];

const RATINGS: { value: Rating; label: string; tone: string }[] = [
  { value: 'again', label: 'Again', tone: 'border-rust-500 text-rust-700 hover:bg-rust-100' },
  { value: 'hard', label: 'Hard', tone: 'border-ochre-500 text-ochre-700 hover:bg-ochre-100' },
  { value: 'good', label: 'Good', tone: 'border-moss-500 text-moss-700 hover:bg-moss-100' },
  { value: 'easy', label: 'Easy', tone: 'border-ink-400 text-ink-700 hover:bg-paper-dark' },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function Review() {
  const [params] = useSearchParams();
  const nodeId = params.get('node');

  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);
  const rateCard = useAppStore((s) => s.rateCard);
  const recordReviewSession = useAppStore((s) => s.recordReviewSession);
  const sessionLogged = useRef(false);

  // Build the review queue once, on first render (lazy state initializer).
  const [initialIds] = useState<string[]>(() => {
    let cards: Flashcard[];
    if (nodeId) {
      const node = course.nodes.find((n) => n.id === nodeId);
      cards = node
        ? (node.flashcardIds
            .map((id) => course.flashcards.find((c) => c.id === id))
            .filter(Boolean) as Flashcard[])
        : [];
    } else {
      cards = getDueCards(course, state);
    }
    cards.sort((a, b) => {
      const da = isDue(state.cards[a.id]?.due ?? new Date().toISOString()) ? 0 : 1;
      const db = isDue(state.cards[b.id]?.due ?? new Date().toISOString()) ? 0 : 1;
      return da - db;
    });
    return cards.map((c) => c.id);
  });

  const total = initialIds.length;
  const [queue, setQueue] = useState<string[]>(initialIds);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);

  const node = nodeId ? course.nodes.find((n) => n.id === nodeId) : null;
  const card = course.flashcards.find((c) => c.id === queue[0]);
  const accuracy = done > 0 ? Math.round((correct / done) * 100) : 0;

  // Log one completed review session (counts toward retest repair, Part 7).
  useEffect(() => {
    if (total > 0 && queue.length === 0 && done > 0 && !sessionLogged.current) {
      sessionLogged.current = true;
      recordReviewSession();
    }
  }, [total, queue.length, done, recordReviewSession]);

  const answerCorrect = useMemo(() => {
    if (!card) return false;
    const candidates = [card.back, ...(card.alternates ?? [])].map(normalize);
    return candidates.includes(normalize(typed));
  }, [card, typed]);

  if (total === 0) {
    return (
      <div>
        <PageHeader title="Review" back="/today" />
        <div className="card p-8 text-center">
          <p className="font-serif text-lg text-ink-900">No cards due.</p>
          <p className="mt-1 text-sm text-ink-600">
            Cards come back when their interval lapses. Study a new skill to add more.
          </p>
          <Link to="/today" className="btn-secondary mt-5 inline-flex">
            Back to today
          </Link>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div>
        <PageHeader title="Session done" back="/today" />
        <div className="card p-8 text-center">
          <p className="font-serif text-4xl font-semibold text-ink-900">
            {correct} / {done}
          </p>
          <p className="mt-1 label">correct this session</p>
          <p className="mx-auto mt-3 max-w-sm text-sm text-ink-600">
            {accuracy >= 85
              ? 'Strong recall. Mastery moved up.'
              : accuracy >= 70
                ? 'Passable. These stay in rotation.'
                : 'Shaky. Expect them back soon.'}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link to="/today" className="btn-secondary">
              Today
            </Link>
            <Link to="/roadmap" className="btn-primary">
              Roadmap
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function handleRate(rating: Rating) {
    if (!card) return;
    rateCard(card.id, rating);
    if (rating === 'good' || rating === 'easy') setCorrect((c) => c + 1);
    setDone((d) => d + 1);
    setQueue((q) => {
      const [head, ...rest] = q;
      return rating === 'again' ? [...rest, head] : rest;
    });
    setRevealed(false);
    setTyped('');
  }

  const progressPct = (done / Math.max(total, done)) * 100;
  const needsTyping = TYPED_TYPES.includes(card.type);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={node ? `Review · ${node.title}` : 'Due review'}
        back={node ? `/lesson/${node.id}` : '/today'}
      />

      <div className="mb-3 flex items-center justify-between font-mono text-xs text-ink-500">
        <span>{done} done</span>
        <span>{queue.length} left</span>
      </div>
      <ProgressBar value={progressPct} className="mb-6" />

      <div className="card p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="tag tag-ink">{TYPE_LABEL[card.type]}</span>
          <span className="font-mono text-xs text-ink-400">
            {Math.min(done + 1, total)} / {total}
          </span>
        </div>

        <p className="text-center text-sm text-ink-600">{card.prompt}</p>

        <div className="py-6 text-center">
          {card.type === 'cloze' ? (
            <>
              <p className="font-serif text-2xl font-semibold text-ink-900 sm:text-3xl">
                {card.sentence}
              </p>
              <p className="mt-2 text-sm text-ink-500">{card.front}</p>
            </>
          ) : (
            <p className="font-serif text-2xl font-semibold text-ink-900 sm:text-3xl">{card.front}</p>
          )}
          {card.hint && !revealed && (
            <p className="mt-3 font-mono text-xs text-ochre-600">hint: {card.hint}</p>
          )}
        </div>

        {needsTyping && !revealed && (
          <input
            autoFocus
            className="input-field text-center text-lg"
            placeholder="Type it, then check"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setRevealed(true)}
          />
        )}

        {revealed && (
          <div className="border border-ink-200 bg-paper p-4 text-center">
            <p className="label">answer</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-ink-900">{card.back}</p>
            {card.type === 'cloze' && card.sentence && (
              <p className="mt-1 text-sm text-ink-500">{card.sentence.replace('____', card.back)}</p>
            )}
            {needsTyping && typed && (
              <p className={`mt-2 text-sm font-medium ${answerCorrect ? 'text-moss-700' : 'text-rust-700'}`}>
                you wrote: {typed} {answerCorrect ? '· match' : '· compare above'}
              </p>
            )}
          </div>
        )}

        <div className="mt-6">
          {!revealed ? (
            <button onClick={() => setRevealed(true)} className="btn-primary w-full">
              Show answer
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => handleRate(r.value)}
                  className={`btn border bg-paper-card font-semibold ${r.tone}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 label text-center">rate honestly. it sets the next interval.</p>
    </div>
  );
}
