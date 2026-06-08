import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { computeLevels, levelNodes, sessionsUntilRetest } from '../lib/levels';
import { levelDef } from '../data/buildCourse';
import { LEVEL_ORDER } from '../data/spanish';
import type { CEFRLevel, LevelStatus } from '../types';

const STATUS_LABEL: Record<LevelStatus, string> = {
  locked: 'locked',
  assumed: 'assumed',
  current: 'current',
  repair: 'repair needed',
  test_ready: 'test ready',
  passed: 'passed',
};

const STATUS_TONE: Record<LevelStatus, string> = {
  locked: 'tag-ink',
  assumed: 'tag-ink',
  current: 'tag-ochre',
  repair: 'tag-rust',
  test_ready: 'tag-moss',
  passed: 'tag-moss',
};

export function Roadmap() {
  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);
  const { byLevel, currentLevel } = computeLevels(course, state);

  return (
    <div>
      <PageHeader
        title="The route map"
        subtitle="A1 to C2. Each stage is sealed until the one before it is passed. C2 is the destination."
        actions={
          <div className="text-right">
            <div className="label">Working on</div>
            <div className="font-serif text-2xl font-semibold text-ochre-600">{currentLevel}</div>
          </div>
        }
      />

      {/* Compact ladder */}
      <div className="mb-6 flex flex-wrap items-center gap-1 font-mono text-sm">
        {LEVEL_ORDER.map((lvl, i) => {
          const st = byLevel[lvl]?.status ?? 'locked';
          return (
            <span key={lvl} className="flex items-center gap-1">
              <span
                className={`rounded-sm border px-2 py-1 font-semibold ${
                  lvl === currentLevel
                    ? 'border-ink-900 bg-ink-900 text-paper'
                    : st === 'passed'
                      ? 'border-moss-500 bg-moss-100 text-moss-700'
                      : st === 'locked'
                        ? 'border-ink-200 text-ink-400'
                        : 'border-ink-300 text-ink-700'
                }`}
              >
                {lvl}
              </span>
              {i < LEVEL_ORDER.length - 1 && <span className="text-ink-400">→</span>}
            </span>
          );
        })}
      </div>

      <div className="space-y-3">
        {LEVEL_ORDER.map((lvl) => (
          <LevelCard key={lvl} level={lvl} />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2 text-ink-500">
        <span className="label">legend</span>
        <span className="tag tag-ink">locked</span>
        <span className="tag tag-ink">assumed</span>
        <span className="tag tag-ochre">current</span>
        <span className="tag tag-moss">test ready</span>
        <span className="tag tag-rust">repair needed</span>
        <span className="tag tag-moss">passed</span>
      </div>
    </div>
  );

  function LevelCard({ level }: { level: CEFRLevel }) {
    const def = levelDef(course, level);
    const lp = byLevel[level];
    const status = lp?.status ?? 'locked';
    const nodes = levelNodes(course, level);
    const weakSkills = nodes.filter((n) => state.nodes[n.id]?.weak || state.nodes[n.id]?.repair).length;
    const toFinish = nodes.filter((n) => {
      const np = state.nodes[n.id];
      return !np?.assumed && np?.status !== 'passed';
    }).length;
    const locked = status === 'locked';
    const retestIn = sessionsUntilRetest(state, level);

    let testAvailability: string;
    if (status === 'passed') testAvailability = 'passed';
    else if (locked) testAvailability = 'locked';
    else if (retestIn > 0) testAvailability = `retest in ${retestIn} session${retestIn === 1 ? '' : 's'}`;
    else testAvailability = 'test available';

    const tone = status === 'repair' ? 'rust' : status === 'passed' || status === 'test_ready' ? 'moss' : 'ink';

    const body = (
      <div
        className={`card p-4 transition ${
          locked ? 'opacity-70' : 'hover:border-ink-500'
        } ${level === currentLevel ? 'border-ink-900' : ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-ink-500">{level}</span>
              <h3 className="font-serif text-lg font-semibold text-ink-900">{def?.title ?? level}</h3>
              <span className={`tag ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>
            </div>
            <p className="mt-1 text-sm text-ink-600">{def?.description}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-serif text-xl font-semibold text-ink-900">{lp?.mastery ?? 0}%</div>
            <div className="label">mastery</div>
          </div>
        </div>

        {!locked && (
          <ProgressBar value={lp?.mastery ?? 0} className="mt-3" tone={tone} />
        )}

        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[11px] text-ink-500 sm:grid-cols-4">
          <Field k="weak skills" v={String(weakSkills)} />
          <Field k="to finish" v={status === 'assumed' || status === 'passed' ? '—' : `${toFinish} skills`} />
          <Field k="workload" v={status === 'assumed' ? 'assumed' : `~${toFinish * 15}m`} />
          <Field k="level test" v={testAvailability} />
        </div>

        {lp && lp.failedAreas.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="label text-rust-700">failed</span>
            {lp.failedAreas.slice(0, 4).map((f) => (
              <span key={f} className="tag tag-rust">
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
    );

    return locked ? <div>{body}</div> : <Link to={`/level/${level}`}>{body}</Link>;
  }
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{k}</span>
      <span className="text-ink-700">{v}</span>
    </div>
  );
}
