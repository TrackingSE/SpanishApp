import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { buildToday, getDueCards } from '../lib/today';
import { todayKey } from '../lib/date';
import type { TaskKind } from '../types';

const KIND_LABEL: Record<TaskKind, string> = {
  review: 'review',
  lesson: 'skill',
  input: 'input',
  output: 'output',
};

export function Today() {
  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);
  const profile = state.profile!;

  const plan = buildToday(course, state);
  const due = getDueCards(course, state);
  const stat = state.stats[todayKey()];

  const overall = Math.round(
    course.nodes.reduce((sum, n) => sum + (state.nodes[n.id]?.mastery ?? 0), 0) /
      course.nodes.length,
  );
  const passed = course.nodes.filter((n) => state.nodes[n.id]?.status === 'passed').length;
  const doneToday =
    (stat?.reviewsDone ?? 0) +
    (stat?.lessonsDone ?? 0) +
    (stat?.inputDone ?? 0) +
    (stat?.outputDone ?? 0);

  return (
    <div>
      <PageHeader
        title="Do this today"
        subtitle={`Spanish A1 · ${profile.goal.toLowerCase()} · ${profile.dailyMinutes} min target`}
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Course mastery" value={`${overall}%`}>
          <ProgressBar value={overall} className="mt-2" tone="moss" />
        </Stat>
        <Stat label="Cards due" value={`${due.length}`} />
        <Stat label="Skills passed" value={`${passed} / ${course.nodes.length}`} />
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <span className="label">Plan</span>
        <span className="font-mono text-xs text-ink-500">{doneToday} done today</span>
      </div>

      {plan.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-serif text-lg text-ink-900">Nothing scheduled right now.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-600">
            No cards are due and the unlocked skills are in good shape. Come back when reviews fall
            due, or open the roadmap to look ahead.
          </p>
          <Link to="/roadmap" className="btn-secondary mt-5 inline-flex">
            Open roadmap
          </Link>
        </div>
      ) : (
        <ol className="space-y-2">
          {plan.map((item, i) => (
            <li key={`${item.kind}-${item.to}-${i}`}>
              <Link
                to={item.to}
                className="card flex items-stretch gap-0 overflow-hidden p-0 transition hover:border-ink-500"
              >
                <span className="flex w-12 shrink-0 items-center justify-center border-r border-ink-200 bg-paper font-mono text-sm text-ink-500">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 p-4">
                  <span className="flex items-center gap-2">
                    <span className="tag tag-ink">{KIND_LABEL[item.kind]}</span>
                    {i === 0 && <span className="tag tag-rust">do first</span>}
                  </span>
                  <span className="mt-1.5 block font-serif text-base font-semibold text-ink-900">
                    {item.title}
                  </span>
                  <span className="block text-sm text-ink-600">{item.why}</span>
                </span>
                <span className="flex items-center pr-4 font-mono text-ink-400" aria-hidden>
                  &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-6 label text-center">
        order: overdue reviews · weak skills · current skill · input · output · new skill
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card p-3 sm:p-4">
      <p className="label">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-ink-900">{value}</p>
      {children}
    </div>
  );
}
