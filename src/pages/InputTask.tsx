import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { THRESHOLDS } from '../lib/adaptive';

interface Token {
  text: string;
  word: string;
  key: string;
}

function tokenize(text: string): Token[] {
  const parts = text.split(/(\s+|[.,;:¿?¡!"—-])/);
  return parts
    .filter((p) => p.length > 0)
    .map((p, i) => ({
      text: p,
      word: /[\p{L}\d]/u.test(p) ? p.toLowerCase() : '',
      key: `${i}-${p}`,
    }));
}

export function InputTask() {
  const { taskId } = useParams();
  const course = useAppStore((s) => s.course());
  const recordInputResult = useAppStore((s) => s.recordInputResult);

  const task = course.inputTasks.find((t) => t.id === taskId);
  const tokens = useMemo(() => (task ? tokenize(task.text) : []), [task]);

  const [unknown, setUnknown] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!task) {
    return (
      <div className="card p-8 text-center text-ink-600">
        Task not found.{' '}
        <Link to="/today" className="font-medium underline">
          Back to today
        </Link>
      </div>
    );
  }

  const node = course.nodes.find((n) => n.id === task.nodeId);
  const totalWords = tokens.filter((t) => t.word).length;
  const unknownWords = new Set([...unknown].filter((u) => tokens.some((t) => t.word === u)));
  const coverage =
    totalWords > 0 ? Math.round(((totalWords - unknownWords.size) / totalWords) * 100) : 100;

  const correctCount = task.questions.filter((q) => answers[q.id] === q.answerIndex).length;
  const accuracy = task.questions.length
    ? Math.round((correctCount / task.questions.length) * 100)
    : 0;
  const passed = accuracy >= THRESHOLDS.passInput;
  const allAnswered = task.questions.every((q) => answers[q.id] !== undefined);

  function toggleWord(word: string) {
    if (!word) return;
    setUnknown((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }

  function handleSubmit() {
    setSubmitted(true);
    recordInputResult(task!.id, task!.nodeId, accuracy);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={task.title}
        subtitle={`${task.type} · ${node?.title ?? ''}`}
        back={node ? `/lesson/${node.id}` : '/today'}
      />

      <div className="mb-6 card p-4">
        <div className="flex items-center justify-between">
          <span className="label">Known-word coverage</span>
          <span className="font-serif text-xl font-semibold text-ink-900">{coverage}%</span>
        </div>
        <ProgressBar
          value={coverage}
          className="mt-2"
          tone={coverage >= 80 ? 'moss' : 'ochre'}
        />
        <p className="mt-2 font-mono text-[11px] text-ink-500">
          {unknownWords.size} marked unknown · estimate for this skill was {task.coverageEstimate}% ·
          tap words you do not know
        </p>
      </div>

      <section className="card p-6">
        <h2 className="label">Text</h2>
        <p className="mt-3 font-serif text-lg leading-relaxed text-ink-900">
          {tokens.map((t) =>
            t.word ? (
              <button
                key={t.key}
                onClick={() => toggleWord(t.word)}
                className={`transition ${
                  unknown.has(t.word) ? 'bg-ochre-100 text-ochre-700 underline' : 'hover:bg-paper-dark'
                }`}
              >
                {t.text}
              </button>
            ) : (
              <span key={t.key}>{t.text}</span>
            ),
          )}
        </p>

        {task.glossary.length > 0 && (
          <div className="mt-5 border border-ink-200 bg-paper p-4">
            <h3 className="label">Glossary</h3>
            <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {task.glossary.map((g) => (
                <div key={g.word} className="flex justify-between gap-3 text-sm">
                  <dt className="font-medium text-ink-800">{g.word}</dt>
                  <dd className="text-ink-500">{g.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>

      <section className="mt-6 card p-6">
        <h2 className="label">Comprehension</h2>
        <div className="mt-4 space-y-5">
          {task.questions.map((q, qi) => (
            <div key={q.id}>
              <p className="mb-2 font-medium text-ink-900">
                {qi + 1}. {q.question}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {q.options.map((opt, oi) => {
                  const selected = answers[q.id] === oi;
                  const isAnswer = q.answerIndex === oi;
                  let cls = 'border-ink-300 bg-paper-card text-ink-700 hover:border-ink-500';
                  if (submitted) {
                    if (isAnswer) cls = 'border-moss-500 bg-moss-100 text-moss-700';
                    else if (selected) cls = 'border-rust-500 bg-rust-100 text-rust-700';
                    else cls = 'border-ink-200 bg-paper text-ink-400';
                  } else if (selected) {
                    cls = 'border-ink-900 bg-ink-900 text-paper';
                  }
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      className={`rounded-md border px-3 py-2 text-left text-sm font-medium transition ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!submitted ? (
          <button onClick={handleSubmit} disabled={!allAnswered} className="btn-primary mt-6 w-full">
            Check answers
          </button>
        ) : (
          <div
            className={`mt-6 border p-4 text-center ${
              passed ? 'border-moss-500 bg-moss-100' : 'border-ochre-500 bg-ochre-100'
            }`}
          >
            <p className="font-serif text-3xl font-semibold text-ink-900">{accuracy}%</p>
            <p className="mt-1 text-sm font-medium text-ink-700">
              {passed ? 'Passed. This counts toward the skill.' : 'Needs another round. Re-read and retry.'}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {node && (
                <Link to={`/lesson/${node.id}`} className="btn-secondary">
                  Back to skill
                </Link>
              )}
              <Link to="/today" className="btn-primary">
                Continue
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
