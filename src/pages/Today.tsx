import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { buildStudyPlan, getDueCards } from '../lib/today';
import { computeLevels } from '../lib/levels';
import { todayKey } from '../lib/date';
import type { StudyTaskType } from '../types';

const KIND_LABEL: Record<StudyTaskType, string> = {
  review: 'review',
  lesson: 'lesson',
  repair: 'repair',
  input: 'input',
  output: 'output',
  diagnostic: 'diagnostic',
  level_test: 'level test',
  recap: 'recap',
};

const KIND_TONE: Record<StudyTaskType, string> = {
  review: 'tag-ochre',
  lesson: 'tag-ink',
  repair: 'tag-rust',
  input: 'tag-ink',
  output: 'tag-ink',
  diagnostic: 'tag-rust',
  level_test: 'tag-moss',
  recap: 'tag-ink',
};

const MINUTES = [15, 30, 60, 120];
const MINUTE_LABEL: Record<number, string> = { 15: '15 min', 30: '30 min', 60: '1 hour', 120: '2 hours' };

export function Today() {
  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);
  const setDailyMinutes = useAppStore((s) => s.setDailyMinutes);
  const profile = state.profile!;

  const minutes = profile.dailyMinutes;
  const plan = buildStudyPlan(course, state, minutes);
  const due = getDueCards(course, state);
  const { currentLevel, byLevel } = computeLevels(course, state);
  const levelMastery = byLevel[currentLevel]?.mastery ?? 0;
  const stat = state.stats[todayKey()];
  const doneToday =
    (stat?.reviewsDone ?? 0) +
    (stat?.lessonsDone ?? 0) +
    (stat?.inputDone ?? 0) +
    (stat?.outputDone ?? 0);

  return (
    <div>
      <PageHeader
        title="Do this today"
        subtitle={`${currentLevel} · ${profile.goal.toLowerCase()} · long-term target C2`}
      />

      {/* Time picker */}
      <div className="mb-5 card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label">You picked</p>
            <p className="font-serif text-xl font-semibold text-ink-900">{MINUTE_LABEL[minutes]}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MINUTES.map((m) => (
              <button
                key={m}
                onClick={() => setDailyMinutes(m)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                  minutes === m
                    ? 'border-ink-900 bg-ink-900 text-paper'
                    : 'border-ink-300 bg-paper-card text-ink-700 hover:border-ink-500'
                }`}
              >
                {MINUTE_LABEL[m]}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-600">{plan.explanation}</p>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label={`${currentLevel} mastery`} value={`${levelMastery}%`}>
          <ProgressBar value={levelMastery} className="mt-2" tone="moss" />
        </Stat>
        <Stat label="Cards due" value={`${due.length}`} />
        <Stat label="Plan length" value={`~${plan.estimatedMinutes}m`} />
      </div>

      {/* Targets and blockers */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <p className="label">Main target</p>
          <p className="mt-1 font-serif text-base font-semibold text-ink-900">{plan.mainTarget}</p>
        </div>
        <div className="card p-4">
          <p className="label">Blocking next level</p>
          {plan.blockingNextLevel.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {plan.blockingNextLevel.map((b) => (
                <span key={b} className="tag tag-rust">
                  {b}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-ink-600">Nothing — you are clear to test.</p>
          )}
        </div>
      </div>

      {plan.overloadedWithReviews && (
        <div className="mb-4 border border-ochre-500 bg-ochre-100 p-3 text-sm text-ochre-700">
          You are carrying a heavy review backlog. Clear reviews first; new material is on hold until
          the load drops.
        </div>
      )}

      <div className="mb-3 flex items-baseline justify-between">
        <span className="label">Do these in order</span>
        <span className="font-mono text-xs text-ink-500">{doneToday} done today</span>
      </div>

      {plan.tasks.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-serif text-lg text-ink-900">Nothing scheduled right now.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-600">
            No reviews are due and the current level is in good shape. Open the roadmap to look ahead
            or take the level test.
          </p>
          <Link to="/roadmap" className="btn-secondary mt-5 inline-flex">
            Open roadmap
          </Link>
        </div>
      ) : (
        <ol className="space-y-2">
          {plan.tasks.map((item, i) => (
            <li key={item.id}>
              <Link
                to={item.to}
                className="card flex items-stretch gap-0 overflow-hidden p-0 transition hover:border-ink-500"
              >
                <span className="flex w-12 shrink-0 items-center justify-center border-r border-ink-200 bg-paper font-mono text-sm text-ink-500">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 p-4">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`tag ${KIND_TONE[item.type]}`}>{KIND_LABEL[item.type]}</span>
                    {i === 0 && <span className="tag tag-rust">do first</span>}
                    <span className="font-mono text-[11px] text-ink-400">~{item.estimatedMinutes}m</span>
                  </span>
                  <span className="mt-1.5 block font-serif text-base font-semibold text-ink-900">
                    {item.title}
                  </span>
                  <span className="block text-sm text-ink-600">{item.reason}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-ink-400">
                    unlocks: {item.unlocks}
                  </span>
                </span>
                <span className="flex items-center pr-4 font-mono text-ink-400" aria-hidden>
                  &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
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
