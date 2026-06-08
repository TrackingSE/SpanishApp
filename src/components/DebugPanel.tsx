import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getDueCards, buildStudyPlan } from '../lib/today';
import { isNodeUnlocked, STATE_LABEL } from '../lib/adaptive';
import { computeLevels, lastAttempt } from '../lib/levels';
import { LEVEL_ORDER } from '../data/spanish';

type Tab = 'levels' | 'tools' | 'plans' | 'state' | 'storage';

// Developer panel. Rendered only in development (`import.meta.env.DEV`).
export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('tools');
  const [planMinutes, setPlanMinutes] = useState(60);
  const navigate = useNavigate();

  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);
  const reseed = useAppStore((s) => s.reseed);
  const resetAll = useAppStore((s) => s.resetAll);
  const devSetStartingLevel = useAppStore((s) => s.devSetStartingLevel);
  const devForcePass = useAppStore((s) => s.devForcePass);
  const devForceFail = useAppStore((s) => s.devForceFail);

  if (!import.meta.env.DEV) return null;

  const unlocked = course.nodes.filter((n) => isNodeUnlocked(state.nodes[n.id]));
  const due = getDueCards(course, state);
  const { byLevel, currentLevel } = computeLevels(course, state);
  const rawStorage =
    typeof window !== 'undefined' ? window.localStorage.getItem('linguamap.state.v2') : null;

  function openLatestReport() {
    const att = lastAttempt(state, currentLevel) ?? Object.values(state.attempts).slice(-1)[0];
    if (att) navigate(`/diagnostic/${att.id}`);
  }

  const plan = buildStudyPlan(course, state, planMinutes);

  return (
    <div className="fixed bottom-3 right-3 z-50 font-mono text-[11px]">
      {open ? (
        <div className="flex max-h-[78vh] w-[400px] flex-col overflow-hidden rounded-md border border-ink-700 bg-ink-900 text-ink-100 shadow-xl">
          <div className="flex items-center justify-between gap-1 border-b border-ink-700 px-2 py-1.5">
            <span className="font-semibold uppercase tracking-wider text-ink-300">debug · dev</span>
            <div className="flex items-center gap-1">
              {(['tools', 'levels', 'plans', 'state', 'storage'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded px-1.5 py-0.5 ${
                    tab === t ? 'bg-paper text-ink-900' : 'text-ink-400 hover:bg-ink-800'
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => setOpen(false)}
                className="ml-1 rounded px-1.5 py-0.5 text-ink-400 hover:bg-ink-800"
              >
                x
              </button>
            </div>
          </div>

          <div className="overflow-auto p-2 leading-relaxed">
            {tab === 'tools' && (
              <div className="space-y-3">
                <Sec title="select test user level (resets progress)">
                  <Grid>
                    {LEVEL_ORDER.map((l) => (
                      <DevBtn key={l} onClick={() => devSetStartingLevel(l)}>
                        {l}
                      </DevBtn>
                    ))}
                  </Grid>
                </Sec>
                <Sec title="force pass / unlock level">
                  <Grid>
                    {LEVEL_ORDER.map((l) => (
                      <DevBtn key={l} onClick={() => devForcePass(l)}>
                        {l}✓
                      </DevBtn>
                    ))}
                  </Grid>
                </Sec>
                <Sec title="force fail assessment (diagnostic)">
                  <Grid>
                    {LEVEL_ORDER.map((l) => (
                      <DevBtn key={l} onClick={() => devForceFail(l)}>
                        {l}✗
                      </DevBtn>
                    ))}
                  </Grid>
                </Sec>
                <Sec title="reports & data">
                  <div className="grid grid-cols-2 gap-1">
                    <DevBtn onClick={openLatestReport}>show diagnostic</DevBtn>
                    <DevBtn onClick={() => navigate(`/assessment/${currentLevel}`)}>open test</DevBtn>
                    <DevBtn onClick={() => reseed()}>reseed course</DevBtn>
                    <DevBtn onClick={() => resetAll()}>reset all</DevBtn>
                  </div>
                </Sec>
              </div>
            )}

            {tab === 'levels' && (
              <div className="space-y-1">
                {LEVEL_ORDER.map((l) => {
                  const lp = byLevel[l];
                  return (
                    <div key={l} className="flex justify-between">
                      <span className={l === currentLevel ? 'text-paper' : 'text-ink-300'}>
                        {l} {l === currentLevel ? '(current)' : ''}
                      </span>
                      <span className="text-ink-400">
                        {lp?.status} · {lp?.mastery ?? 0}%
                        {lp && lp.weakAreas.length ? ` · weak:${lp.weakAreas.length}` : ''}
                      </span>
                    </div>
                  );
                })}
                <div className="mt-2 text-ink-400">studySessions: {state.studySessions}</div>
                <div className="text-ink-400">attempts: {Object.keys(state.attempts).length}</div>
              </div>
            )}

            {tab === 'plans' && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[15, 30, 60, 120].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPlanMinutes(m)}
                      className={`rounded px-1.5 py-0.5 ${
                        planMinutes === m ? 'bg-paper text-ink-900' : 'text-ink-400 hover:bg-ink-800'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
                <div className="text-ink-300">target: {plan.mainTarget}</div>
                <div className="text-ink-400">blocking: {plan.blockingNextLevel.join(', ') || 'none'}</div>
                <div className="text-ink-400">~{plan.estimatedMinutes}m · overloaded: {String(plan.overloadedWithReviews)}</div>
                <div className="space-y-0.5">
                  {plan.tasks.map((t, i) => (
                    <div key={t.id} className="flex justify-between">
                      <span className="text-ink-200">{i + 1}. {t.type}</span>
                      <span className="text-ink-500">{t.estimatedMinutes}m</span>
                    </div>
                  ))}
                  {plan.tasks.length === 0 && <span className="text-ink-500">empty plan</span>}
                </div>
              </div>
            )}

            {tab === 'state' && (
              <div className="space-y-2">
                <Sec title="current user">
                  {state.profile ? (
                    <span className="text-ink-300">
                      {state.profile.targetLanguage} · start {state.profile.startingLevel} · now{' '}
                      {state.profile.level} · {state.profile.goal} · {state.profile.dailyMinutes}m
                    </span>
                  ) : (
                    <span className="text-ink-500">none</span>
                  )}
                </Sec>
                <Sec title={`unlocked ${unlocked.length}/${course.nodes.length}`}>
                  {course.nodes.slice(0, 60).map((n) => {
                    const np = state.nodes[n.id];
                    return (
                      <div key={n.id} className="flex justify-between">
                        <span className={isNodeUnlocked(np) ? 'text-ink-200' : 'text-ink-500'}>{n.id}</span>
                        <span className="text-ink-400">
                          {np?.mastery ?? 0}% {STATE_LABEL[np?.status ?? 'locked']}
                          {np?.assumed ? '/assumed' : ''}
                          {np?.repair ? '/repair' : ''}
                          {np?.weak ? '/weak' : ''}
                        </span>
                      </div>
                    );
                  })}
                </Sec>
                <Sec title={`due cards ${due.length}`}>
                  <span className="text-ink-500">{due.length} due</span>
                </Sec>
              </div>
            )}

            {tab === 'storage' && (
              <pre className="whitespace-pre-wrap break-all text-ink-300">
                {rawStorage ? JSON.stringify(JSON.parse(rawStorage), null, 1) : 'empty'}
              </pre>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded border border-ink-700 bg-ink-900 px-2.5 py-1 font-semibold text-ink-200 shadow-lg hover:bg-ink-800"
        >
          debug
        </button>
      )}
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 font-semibold text-ink-300">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-6 gap-1">{children}</div>;
}

function DevBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded border border-ink-600 px-1.5 py-1 text-center text-ink-200 hover:bg-ink-800"
    >
      {children}
    </button>
  );
}
