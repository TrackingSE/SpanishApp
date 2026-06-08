import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getDueCards } from '../lib/today';
import { isNodeUnlocked, STATE_LABEL } from '../lib/adaptive';

// Developer panel. Rendered only in development (`import.meta.env.DEV`).
export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'state' | 'counts' | 'storage'>('state');
  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);
  const reseed = useAppStore((s) => s.reseed);

  if (!import.meta.env.DEV) return null;

  const unlocked = course.nodes.filter((n) => isNodeUnlocked(state.nodes[n.id]));
  const due = getDueCards(course, state);
  const rawStorage =
    typeof window !== 'undefined' ? window.localStorage.getItem('linguamap.state.v1') : null;

  return (
    <div className="fixed bottom-3 right-3 z-50 font-mono text-[11px]">
      {open ? (
        <div className="flex max-h-[72vh] w-[380px] flex-col overflow-hidden rounded-md border border-ink-700 bg-ink-900 text-ink-100 shadow-xl">
          <div className="flex items-center justify-between gap-1 border-b border-ink-700 px-2 py-1.5">
            <span className="font-semibold uppercase tracking-wider text-ink-300">debug · dev</span>
            <div className="flex items-center gap-1">
              {(['state', 'counts', 'storage'] as const).map((t) => (
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
            {tab === 'state' && (
              <div className="space-y-2">
                <Sec title="current user">
                  {state.profile ? (
                    <span className="text-ink-300">
                      {state.profile.targetLanguage} · {state.profile.level} · {state.profile.goal} ·{' '}
                      {state.profile.dailyMinutes}m
                    </span>
                  ) : (
                    <span className="text-ink-500">none</span>
                  )}
                </Sec>
                <Sec title={`unlocked ${unlocked.length}/${course.nodes.length} · mastery`}>
                  {course.nodes.map((n) => {
                    const np = state.nodes[n.id];
                    return (
                      <div key={n.id} className="flex justify-between">
                        <span className={isNodeUnlocked(np) ? 'text-ink-200' : 'text-ink-500'}>{n.id}</span>
                        <span className="text-ink-400">
                          {np?.mastery ?? 0}% {STATE_LABEL[np?.status ?? 'locked']}
                          {np?.weak ? '/weak' : ''}
                          {np?.due ? '/due' : ''}
                        </span>
                      </div>
                    );
                  })}
                </Sec>
                <Sec title={`due cards ${due.length}`}>
                  {due.slice(0, 30).map((c) => (
                    <div key={c.id} className="flex justify-between">
                      <span className="text-ink-300">{c.id}</span>
                      <span className="text-ink-500">{c.type}</span>
                    </div>
                  ))}
                  {due.length === 0 && <span className="text-ink-500">none</span>}
                </Sec>
              </div>
            )}

            {tab === 'counts' && (
              <div className="space-y-1">
                <Count k="units" v={course.units.length} />
                <Count k="skills" v={course.nodes.length} />
                <Count k="vocabulary" v={course.vocab.length} />
                <Count k="grammar" v={course.grammar.length} />
                <Count k="flashcards" v={course.flashcards.length} />
                <Count k="input tasks" v={course.inputTasks.length} />
                <Count k="output tasks" v={course.outputTasks.length} />
                <button
                  onClick={() => reseed()}
                  className="mt-2 w-full rounded border border-ink-600 py-1 text-ink-200 hover:bg-ink-800"
                >
                  reseed course
                </button>
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

function Count({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-400">{k}</span>
      <span className="text-ink-100">{v}</span>
    </div>
  );
}
