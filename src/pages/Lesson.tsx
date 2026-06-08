import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { NodeTags } from '../components/StatusBadge';
import { Pron } from '../components/Pron';
import { blockingPrereqs, isNodeUnlocked } from '../lib/adaptive';

export function Lesson() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);

  const node = course.nodes.find((n) => n.id === nodeId);
  if (!node) {
    return (
      <div className="card p-8 text-center text-ink-600">
        Skill not found.{' '}
        <Link to="/roadmap" className="font-medium underline">
          Back to roadmap
        </Link>
      </div>
    );
  }

  const np = state.nodes[node.id];

  if (!isNodeUnlocked(np)) {
    const blocked = blockingPrereqs(course, node, state.nodes);
    return (
      <div>
        <PageHeader title={node.title} subtitle={node.goal} back="/roadmap" />
        <div className="card p-8 text-center">
          <span className="tag tag-ink mx-auto">blocked</span>
          <p className="mt-3 font-serif text-lg text-ink-900">Not unlocked yet.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-600">
            Get to 80% on {blocked.join(', ').toLowerCase() || 'the earlier skills'} first.
          </p>
          <Link to="/roadmap" className="btn-secondary mt-5 inline-flex">
            Back to roadmap
          </Link>
        </div>
      </div>
    );
  }

  const vocab = node.vocabularyIds
    .map((id) => course.vocab.find((v) => v.id === id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
  const patterns = node.grammarIds
    .map((id) => course.grammar.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));
  const inputTasks = node.inputTaskIds
    .map((id) => course.inputTasks.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const outputTasks = node.outputTaskIds
    .map((id) => course.outputTasks.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const unlocks = course.nodes.filter((n) => n.prerequisites.includes(node.id));

  return (
    <div>
      <PageHeader title={node.title} subtitle={node.goal} back="/roadmap" actions={<NodeTags progress={np} />} />

      <div className="mb-6 card p-5">
        <p className="label">What you can do after this</p>
        <p className="mt-1 font-serif text-lg text-ink-900">{node.goal}</p>
        {np && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between font-mono text-[11px] text-ink-500">
              <span>mastery</span>
              <span>{np.mastery}%</span>
            </div>
            <ProgressBar value={np.mastery} tone={np.weak ? 'rust' : np.status === 'passed' ? 'moss' : 'ink'} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section className="card p-5">
            <h2 className="label">Patterns</h2>
            <div className="mt-3 space-y-5">
              {patterns.map((g) => (
                <div key={g.id} className="border-t border-ink-200 pt-4 first:border-0 first:pt-0">
                  <h3 className="font-serif text-base font-semibold text-ink-900">{g.title}</h3>
                  <p className="mt-1 font-mono text-xs text-ink-600">{g.pattern}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">{g.explanation}</p>
                  <ul className="mt-3 space-y-3">
                    {g.examples.map((ex, i) => (
                      <li key={i}>
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                          <span className="font-medium text-ink-900">{ex.target}</span>
                          <span className="text-sm text-ink-500">{ex.native}</span>
                        </div>
                        <Pron
                          data={{
                            pronunciation: ex.pronunciation,
                            ipa: ex.ipa,
                            notes: ex.stressNotes ? [ex.stressNotes] : [],
                          }}
                          className="mt-1"
                        />
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 flex gap-2 text-sm text-ink-700">
                    <span className="tag tag-rust shrink-0">watch out</span>
                    <span>{g.commonMistake}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="label">Words ({vocab.length})</h2>
            <ul className="mt-2 divide-y divide-ink-200">
              {vocab.map((v) => (
                <li key={v.id} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <span className="font-medium text-ink-900">{v.spanish}</span>
                    <Pron
                      data={{
                        pronunciation: v.pronunciation,
                        ipa: v.ipa,
                        stress: v.stress ? `stress: ${v.stress}` : undefined,
                      }}
                      showNotes={false}
                    />
                  </div>
                  <span className="shrink-0 text-right text-sm text-ink-500">{v.english}</span>
                </li>
              ))}
            </ul>
          </section>

          <button onClick={() => navigate(`/review?node=${node.id}`)} className="btn-primary w-full">
            Start review ({node.flashcardIds.length} cards)
          </button>

          <section className="card p-5">
            <h2 className="label">Practice</h2>
            <div className="mt-2 space-y-2">
              {inputTasks.map((t) => (
                <TaskLink key={t.id} to={`/input/${t.id}`} kind="input" title={t.title} done={np?.inputPassed} />
              ))}
              {outputTasks.map((t) => (
                <TaskLink key={t.id} to={`/output/${t.id}`} kind="output" title={t.title} done={np?.outputPassed} />
              ))}
            </div>
          </section>

          {unlocks.length > 0 && (
            <section className="card p-5">
              <h2 className="label">Unlocks next</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {unlocks.map((u) => (
                  <Link
                    key={u.id}
                    to={`/lesson/${u.id}`}
                    className="tag tag-ink hover:border-ink-500"
                  >
                    {u.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskLink({
  to,
  kind,
  title,
  done,
}: {
  to: string;
  kind: string;
  title: string;
  done?: boolean;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-md border border-ink-300 px-3 py-2 text-sm transition hover:border-ink-500"
    >
      <span className="flex items-center gap-2">
        <span className="tag tag-ink">{kind}</span>
        <span className="font-medium text-ink-800">{title}</span>
      </span>
      {done ? <span className="tag tag-moss">passed</span> : <span className="font-mono text-ink-400">&rarr;</span>}
    </Link>
  );
}
