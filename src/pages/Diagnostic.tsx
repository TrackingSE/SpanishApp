import { Link, useParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { nextLevel } from '../lib/levels';

export function Diagnostic() {
  const { attemptId } = useParams();
  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);

  const attempt = attemptId ? state.attempts[attemptId] : undefined;

  if (!attempt) {
    return (
      <div className="card p-8 text-center text-ink-600">
        Report not found.{' '}
        <Link to="/roadmap" className="font-medium underline">
          Back to roadmap
        </Link>
      </div>
    );
  }

  const report = attempt.diagnosticReport;
  const level = attempt.levelId;
  const next = nextLevel(level);
  const recNodes = report.recommendedSkillNodeIds
    .map((id) => course.nodes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`${level} diagnostic`}
        subtitle={attempt.passed ? 'Passed.' : 'Not passed. Here is exactly why.'}
        back={`/level/${level}`}
      />

      {/* Headline */}
      <div
        className={`mb-6 card p-6 text-center ${
          attempt.passed ? 'border-moss-500' : 'border-rust-500/50'
        }`}
      >
        <p className="font-serif text-5xl font-semibold text-ink-900">{attempt.score}%</p>
        <span className={`tag mt-2 ${attempt.passed ? 'tag-moss' : 'tag-rust'}`}>
          {attempt.passed ? 'passed' : 'not passed'}
        </span>
        <div className="mx-auto mt-4 max-w-lg space-y-1 text-sm text-ink-700">
          {report.summary.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

      {/* Section scores */}
      <section className="mb-6 card p-5">
        <h2 className="label">Section scores</h2>
        <div className="mt-3 space-y-3">
          {Object.entries(attempt.sectionScores).map(([id, score]) => (
            <div key={id}>
              <div className="mb-1 flex justify-between font-mono text-[11px] text-ink-500">
                <span>{id}</span>
                <span>{score}%</span>
              </div>
              <ProgressBar value={score} tone={score >= 75 ? 'moss' : score >= 50 ? 'ochre' : 'rust'} />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="Passed areas" tone="moss" items={report.passedAreas} empty="Nothing cleared the bar yet." />
        <Panel title="Weak areas" tone="ochre" items={report.weakAreas} empty="No weak areas." />
        <Panel title="Blocking areas" tone="rust" items={report.blockingAreas} empty="Nothing blocking." />
        {report.unknownConcepts.length > 0 && (
          <Panel title="Marked unknown" tone="ink" items={report.unknownConcepts} empty="" />
        )}
      </div>

      {/* Recommended revision */}
      {!attempt.passed && (
        <section className="mt-6 card p-5">
          <h2 className="label">Recommended revision</h2>
          <p className="mt-1 text-sm text-ink-600">
            Revise these before retesting. Do not add {next ?? 'higher-level'} material yet.
          </p>
          {recNodes.length > 0 ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {recNodes.map((n) => (
                <Link
                  key={n.id}
                  to={`/review?node=${n.id}`}
                  className="flex items-center justify-between rounded-md border border-ink-300 px-3 py-2 text-sm hover:border-ink-500"
                >
                  <span className="font-medium text-ink-900">{n.title}</span>
                  <span className="font-mono text-[11px] text-ink-400">{n.level}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-600">No specific skills flagged.</p>
          )}
        </section>
      )}

      {/* Next test requirements */}
      <section className="mt-6 card p-5">
        <h2 className="label">Next test attempt</h2>
        {attempt.passed ? (
          <p className="mt-1 text-sm text-ink-700">
            {next ? `${next} is now unlocked. Open it on the roadmap.` : 'You have reached C2. Keep it sharp.'}
          </p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm text-ink-700">
            <li>· Complete the repair tasks above.</li>
            <li>· Do at least one review session.</li>
            <li>· Do at least one input or output task on a failed area.</li>
            <li>· Then the {level} retest unlocks.</li>
          </ul>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link to={`/level/${level}`} className="btn-secondary">
            Level page
          </Link>
          <Link to="/today" className="btn-primary">
            Back to today
          </Link>
        </div>
      </section>
    </div>
  );
}

function Panel({
  title,
  tone,
  items,
  empty,
}: {
  title: string;
  tone: 'moss' | 'ochre' | 'rust' | 'ink';
  items: string[];
  empty: string;
}) {
  const toneCls =
    tone === 'moss'
      ? 'tag-moss'
      : tone === 'ochre'
        ? 'tag-ochre'
        : tone === 'rust'
          ? 'tag-rust'
          : 'tag-ink';
  return (
    <section className="card p-5">
      <h2 className="label">{title}</h2>
      {items.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <span key={`${it}-${i}`} className={`tag ${toneCls}`}>
              {it}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink-500">{empty}</p>
      )}
    </section>
  );
}
