import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { NodeTags } from '../components/StatusBadge';
import { blockingPrereqs, isNodeUnlocked } from '../lib/adaptive';
import { isDue } from '../lib/date';
import type { NodeProgress, SkillNode } from '../types';

export function Roadmap() {
  const navigate = useNavigate();
  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);

  const overall = Math.round(
    course.nodes.reduce((sum, n) => sum + (state.nodes[n.id]?.mastery ?? 0), 0) /
      course.nodes.length,
  );

  function dueCount(node: SkillNode): number {
    return node.flashcardIds.filter((id) => {
      const cp = state.cards[id];
      return cp && (cp.reps > 0 || cp.recent.length > 0) && isDue(cp.due);
    }).length;
  }

  const sortedUnits = [...course.units].sort((a, b) => a.order - b.order);

  return (
    <div>
      <PageHeader
        title="Roadmap"
        subtitle="Eight legs, forty skills. Each stop unlocks the next when you reach 80%."
        actions={
          <div className="text-right">
            <div className="label">Course</div>
            <div className="font-serif text-2xl font-semibold text-moss-600">{overall}%</div>
          </div>
        }
      />

      <div className="space-y-8">
        {sortedUnits.map((unit) => {
          const nodes = course.nodes
            .filter((n) => n.unitId === unit.id)
            .sort((a, b) => a.position.col - b.position.col);
          return (
            <section key={unit.id}>
              <div className="mb-2 flex items-baseline gap-3">
                <span className="font-mono text-xs font-semibold text-ink-500">
                  {String(unit.order).padStart(2, '0')}
                </span>
                <h2 className="font-serif text-lg font-semibold text-ink-900">{unit.title}</h2>
                <span className="hidden text-sm text-ink-500 sm:inline">{unit.goal}</span>
              </div>

              <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
                {nodes.map((node, i) => {
                  const np = state.nodes[node.id];
                  const next = nodes[i + 1];
                  const connectorOpen = next && isNodeUnlocked(state.nodes[next.id]);
                  return (
                    <div key={node.id} className="flex items-center">
                      <Stop
                        node={node}
                        progress={np}
                        due={dueCount(node)}
                        blockedBy={blockingPrereqs(course, node, state.nodes)}
                        onOpen={() => isNodeUnlocked(np) && navigate(`/lesson/${node.id}`)}
                      />
                      {next && (
                        <span
                          className={`h-0 w-6 shrink-0 border-t-2 ${
                            connectorOpen ? 'border-ink-400' : 'border-dashed border-ink-300'
                          }`}
                          aria-hidden
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2 text-ink-500">
        <span className="label">legend</span>
        <span className="tag tag-ochre">ready</span>
        <span className="tag tag-ochre">learning</span>
        <span className="tag tag-moss">usable</span>
        <span className="tag tag-moss">passed</span>
        <span className="tag tag-rust">weak</span>
        <span className="tag tag-ochre">due</span>
        <span className="tag tag-ink">blocked</span>
      </div>
    </div>
  );
}

function Stop({
  node,
  progress,
  due,
  blockedBy,
  onOpen,
}: {
  node: SkillNode;
  progress?: NodeProgress;
  due: number;
  blockedBy: string[];
  onOpen: () => void;
}) {
  const locked = !isNodeUnlocked(progress);
  const mastery = progress?.mastery ?? 0;
  const tone = progress?.weak ? 'rust' : progress?.status === 'passed' ? 'moss' : 'ink';

  return (
    <button
      onClick={onOpen}
      disabled={locked}
      className={`flex w-56 shrink-0 flex-col gap-2 rounded-md border p-3 text-left shadow-notebook-sm transition ${
        locked
          ? 'cursor-not-allowed border-ink-200 bg-paper'
          : 'border-ink-300 bg-paper-card hover:border-ink-500'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`font-serif text-base font-semibold leading-tight ${
            locked ? 'text-ink-500' : 'text-ink-900'
          }`}
        >
          {node.title}
        </h3>
        <span
          className={`mt-1 h-3 w-3 shrink-0 border ${
            progress?.status === 'passed'
              ? 'border-moss-600 bg-moss-600'
              : locked
                ? 'border-ink-300 bg-paper'
                : 'border-ink-500 bg-paper'
          }`}
          aria-hidden
        />
      </div>

      <p className={`text-xs ${locked ? 'text-ink-400' : 'text-ink-600'}`}>{node.goal}</p>

      <NodeTags progress={progress} />

      {locked ? (
        <p className="font-mono text-[11px] text-ink-500">
          blocked by: {blockedBy.join(', ').toLowerCase()}
        </p>
      ) : (
        <div>
          <div className="mb-1 flex items-center justify-between font-mono text-[11px] text-ink-500">
            <span>{mastery}%</span>
            {due > 0 && <span className="text-ochre-600">{due} due</span>}
          </div>
          <ProgressBar value={mastery} tone={tone} />
        </div>
      )}
    </button>
  );
}
