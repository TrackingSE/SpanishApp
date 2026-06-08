import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { NodeTags } from '../components/StatusBadge';
import { isNodeUnlocked } from '../lib/adaptive';
import {
  bestAttempt,
  computeLevels,
  lastAttempt,
  levelNodes,
  retestAllowed,
  sessionsUntilRetest,
} from '../lib/levels';
import { levelDef } from '../data/buildCourse';
import { LEVEL_ORDER } from '../data/spanish';
import type { CEFRLevel, SkillNode } from '../types';

export function LevelDetail() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);

  const level = (LEVEL_ORDER.includes(levelId as CEFRLevel) ? levelId : null) as CEFRLevel | null;
  const def = level ? levelDef(course, level) : undefined;

  if (!level || !def) {
    return (
      <div className="card p-8 text-center text-ink-600">
        Level not found.{' '}
        <Link to="/roadmap" className="font-medium underline">
          Back to roadmap
        </Link>
      </div>
    );
  }

  const { byLevel } = computeLevels(course, state);
  const lp = byLevel[level];
  const status = lp?.status ?? 'locked';
  const nodes = levelNodes(course, level);
  const units = course.units.filter((u) => u.level === level).sort((a, b) => a.order - b.order);
  const last = lastAttempt(state, level);
  const best = bestAttempt(state, level);
  const pr = def.passRequirements;

  const masteries = nodes.map((n) => state.nodes[n.id]?.mastery ?? 0);
  const skillAvg = masteries.length ? Math.round(masteries.reduce((s, m) => s + m, 0) / masteries.length) : 0;
  const criticalNodes = nodes.filter((n) => n.critical);
  const criticalMin = criticalNodes.length
    ? Math.min(...criticalNodes.map((n) => state.nodes[n.id]?.mastery ?? 0))
    : 100;

  const repairNodes = nodes.filter((n) => state.nodes[n.id]?.repair || state.nodes[n.id]?.weak);
  const canTest = status !== 'locked' && status !== 'assumed' && status !== 'passed';
  const retestBlocked = !retestAllowed(state, level);
  const retestIn = sessionsUntilRetest(state, level);

  const ss = last?.sectionScores ?? {};
  const sectionVal = (id: string) => (ss[id] !== undefined ? `${ss[id]}%` : '—');

  const criteria: { label: string; need: string; got: string; met: boolean }[] = [
    { label: 'Skill mastery', need: `≥ ${pr.skillAverageMastery}%`, got: `${skillAvg}%`, met: skillAvg >= pr.skillAverageMastery },
    { label: 'Critical skills', need: `≥ ${pr.criticalSkillMin}%`, got: `${criticalMin}%`, met: criticalMin >= pr.criticalSkillMin },
    { label: 'Test overall', need: `≥ ${pr.assessmentMin}%`, got: last ? `${last.score}%` : '—', met: (last?.score ?? 0) >= pr.assessmentMin },
    { label: 'Listening', need: `≥ ${pr.listeningMin}%`, got: sectionVal('listening'), met: (ss.listening ?? 0) >= pr.listeningMin },
    { label: 'Reading', need: `≥ ${pr.readingMin}%`, got: sectionVal('reading'), met: (ss.reading ?? 0) >= pr.readingMin },
    { label: 'Writing', need: `≥ ${pr.writingMin}%`, got: sectionVal('writing'), met: (ss.writing ?? 0) >= pr.writingMin },
    { label: 'Grammar / vocab', need: `≥ ${pr.grammarVocabMin}%`, got: last ? `${Math.round(((ss.vocabulary ?? 0) + (ss.grammar ?? 0)) / 2)}%` : '—', met: Math.round(((ss.vocabulary ?? 0) + (ss.grammar ?? 0)) / 2) >= pr.grammarVocabMin },
    { label: 'Speaking task', need: 'complete', got: ss.speaking !== undefined ? (ss.speaking >= 100 ? 'done' : 'incomplete') : '—', met: (ss.speaking ?? 0) >= 100 },
    { label: 'Weak areas', need: `≤ ${pr.maxUnresolvedWeakAreas}`, got: last ? String(last.diagnosticReport.weakAreas.length) : '—', met: (last?.diagnosticReport.weakAreas.length ?? 99) <= pr.maxUnresolvedWeakAreas },
  ];

  return (
    <div>
      <PageHeader
        title={`${level} — ${def.title.replace(/^[A-C][12]\s*—\s*/, '')}`}
        subtitle={def.description}
        back="/roadmap"
        actions={<span className="tag tag-ink">{status}</span>}
      />

      <div className="mb-6 grid gap-3 lg:grid-cols-3">
        {/* Can-do goals */}
        <section className="card p-5 lg:col-span-2">
          <h2 className="label">What you can do at {level}</h2>
          <ul className="mt-2 space-y-1 text-sm text-ink-700">
            {def.canDoGoals.map((goal) => (
              <li key={goal}>· {goal}</li>
            ))}
          </ul>
          <div className="mt-4">
            <div className="mb-1 flex justify-between font-mono text-[11px] text-ink-500">
              <span>level mastery</span>
              <span>{lp?.mastery ?? 0}%</span>
            </div>
            <ProgressBar value={lp?.mastery ?? 0} tone={status === 'repair' ? 'rust' : 'moss'} />
          </div>
        </section>

        {/* Level test */}
        <section className="card p-5">
          <h2 className="label">Level test</h2>
          {status === 'passed' ? (
            <p className="mt-2 text-sm text-ink-700">
              Passed{best ? ` at ${best.score}%` : ''}. The next stage is open.
            </p>
          ) : status === 'assumed' ? (
            <p className="mt-2 text-sm text-ink-700">
              Assumed known. Take the diagnostic only if you suspect gaps.
            </p>
          ) : status === 'locked' ? (
            <p className="mt-2 text-sm text-ink-700">Locked. Pass the level below first.</p>
          ) : (
            <p className="mt-2 text-sm text-ink-700">
              {last
                ? 'Difficult by design. No fake passes. Repair weak areas, then retest.'
                : 'Start with the diagnostic test — it maps exactly what to study.'}
            </p>
          )}

          {retestBlocked && (
            <p className="mt-2 font-mono text-[11px] text-rust-700">
              Retest blocked. Do {retestIn} more study session{retestIn === 1 ? '' : 's'} (a review
              plus an input/output task) first.
            </p>
          )}

          <button
            disabled={status === 'locked' || (canTest && retestBlocked)}
            onClick={() => navigate(`/assessment/${level}`)}
            className="btn-primary mt-4 w-full disabled:opacity-50"
          >
            {status === 'passed'
              ? 'Retake test'
              : last
                ? 'Retake level test'
                : `Take ${level} diagnostic test`}
          </button>
        </section>
      </div>

      {/* Repair queue */}
      {repairNodes.length > 0 && (
        <section className="mb-6 card border-rust-500/40 p-5">
          <h2 className="label text-rust-700">Repair queue</h2>
          <p className="mt-1 text-sm text-ink-600">
            These skills are weak or flagged by a diagnostic. They are blocking the level. Failed
            skills become repair work.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {repairNodes.map((n) => (
              <Link
                key={n.id}
                to={`/review?node=${n.id}`}
                className="flex items-center justify-between rounded-md border border-rust-500/40 bg-rust-100/40 px-3 py-2 text-sm hover:border-rust-500"
              >
                <span className="font-medium text-ink-900">{n.title}</span>
                <span className="font-mono text-[11px] text-rust-700">
                  {state.nodes[n.id]?.mastery ?? 0}%
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Pass criteria */}
      <section className="mb-6 card p-5">
        <h2 className="label">Pass criteria</h2>
        <p className="mt-1 text-sm text-ink-600">
          Every line must be green. {last ? 'Values below are from your last attempt.' : 'Take the test to fill these in.'}
        </p>
        <div className="mt-3 overflow-hidden rounded-md border border-ink-200">
          <table className="w-full text-sm">
            <tbody>
              {criteria.map((c, i) => (
                <tr key={c.label} className={i % 2 ? 'bg-paper' : ''}>
                  <td className="px-3 py-1.5 text-ink-800">{c.label}</td>
                  <td className="px-3 py-1.5 font-mono text-[11px] text-ink-500">{c.need}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-[11px] text-ink-700">{c.got}</td>
                  <td className="px-3 py-1.5 text-right">
                    <span className={`tag ${c.met ? 'tag-moss' : 'tag-rust'}`}>{c.met ? 'ok' : 'no'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Units + skill nodes */}
      <section>
        <h2 className="mb-2 label">Units and skills</h2>
        <div className="space-y-5">
          {units.map((unit) => {
            const unitNodes = nodes
              .filter((n) => n.unitId === unit.id)
              .sort((a, b) => a.position.col - b.position.col);
            return (
              <div key={unit.id}>
                <div className="mb-2 flex items-baseline gap-2">
                  <h3 className="font-serif text-base font-semibold text-ink-900">{unit.title}</h3>
                  <span className="text-sm text-ink-500">{unit.goal}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {unitNodes.map((node) => (
                    <NodeChip key={node.id} node={node} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );

  function NodeChip({ node }: { node: SkillNode }) {
    const np = state.nodes[node.id];
    const locked = !isNodeUnlocked(np);
    const mastery = np?.mastery ?? 0;
    return (
      <Link
        to={locked ? '#' : `/lesson/${node.id}`}
        onClick={(e) => locked && e.preventDefault()}
        className={`block rounded-md border p-3 text-left transition ${
          locked ? 'cursor-not-allowed border-ink-200 bg-paper' : 'border-ink-300 bg-paper-card hover:border-ink-500'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className={`font-serif text-sm font-semibold ${locked ? 'text-ink-500' : 'text-ink-900'}`}>
            {node.title}
          </span>
          {node.critical && <span className="tag tag-ochre">critical</span>}
        </div>
        <p className={`mt-0.5 text-xs ${locked ? 'text-ink-400' : 'text-ink-600'}`}>{node.goal}</p>
        <div className="mt-2">
          <NodeTags progress={np} />
        </div>
        {!locked && <ProgressBar value={mastery} className="mt-2" tone={np?.weak ? 'rust' : np?.assumed ? 'ink' : 'moss'} />}
      </Link>
    );
  }
}
