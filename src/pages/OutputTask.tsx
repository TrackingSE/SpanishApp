import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { evaluateOutput, type OutputFeedback } from '../lib/feedback';

export function OutputTask() {
  const { taskId } = useParams();
  const course = useAppStore((s) => s.course());
  const recordOutputResult = useAppStore((s) => s.recordOutputResult);

  const task = course.outputTasks.find((t) => t.id === taskId);

  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<OutputFeedback | null>(null);
  const [showSample, setShowSample] = useState(false);

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
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  function handleSubmit() {
    const result = evaluateOutput(task!, text);
    setFeedback(result);
    recordOutputResult(task!.id, task!.nodeId, result.score);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={task.title}
        subtitle={`${task.type.replace(/_/g, ' ')} · ${node?.title ?? ''}`}
        back={node ? `/lesson/${node.id}` : '/today'}
      />

      <section className="card p-6">
        <h2 className="label">Task</h2>
        <p className="mt-1 font-serif text-lg text-ink-900">{task.prompt}</p>

        {task.expectedPatterns.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="label">use</span>
            {task.expectedPatterns.map((p) => (
              <span key={p} className="tag tag-ink">
                {p}
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 font-mono text-[11px] text-ink-500">at least {task.minWords} words</p>

        <textarea
          className="input-field mt-4 min-h-[140px] resize-y text-base leading-relaxed"
          placeholder="Write in Spanish"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setFeedback(null);
          }}
        />
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-ink-500">
          <span>{wordCount} words</span>
          <button onClick={() => setShowSample((s) => !s)} className="underline">
            {showSample ? 'hide' : 'show'} sample
          </button>
        </div>

        {showSample && (
          <div className="mt-2 border border-ink-200 bg-paper p-3 text-sm text-ink-700">
            <span className="font-medium text-ink-900">Sample: </span>
            {task.sampleAnswer}
          </div>
        )}

        <button onClick={handleSubmit} disabled={wordCount === 0} className="btn-primary mt-4 w-full">
          Check it
        </button>
      </section>

      {feedback && (
        <section className="mt-6 card p-6">
          <div className="flex items-center justify-between">
            <h2 className="label">Feedback</h2>
            <span className={`tag ${feedback.passed ? 'tag-moss' : 'tag-ochre'}`}>
              {feedback.passed ? 'passed' : 'needs another round'}
            </span>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex justify-between font-mono text-[11px] text-ink-500">
              <span>production score</span>
              <span>{feedback.score} / 100</span>
            </div>
            <ProgressBar value={feedback.score} tone={feedback.passed ? 'moss' : 'ochre'} />
          </div>

          {feedback.positives.length > 0 && (
            <div className="mt-4">
              <h3 className="label text-moss-700">Worked</h3>
              <ul className="mt-1 space-y-1 text-sm text-ink-700">
                {feedback.positives.map((p, i) => (
                  <li key={i}>· {p}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.suggestions.length > 0 && (
            <div className="mt-4">
              <h3 className="label text-ochre-700">Fix</h3>
              <ul className="mt-1 space-y-1 text-sm text-ink-700">
                {feedback.suggestions.map((s, i) => (
                  <li key={i}>· {s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex justify-center gap-2">
            {node && (
              <Link to={`/lesson/${node.id}`} className="btn-secondary">
                Back to skill
              </Link>
            )}
            <Link to="/today" className="btn-primary">
              Continue
            </Link>
          </div>
        </section>
      )}

      <p className="mt-4 label text-center">
        feedback is rule-based: length, key words, punctuation. no grammar engine yet.
      </p>
    </div>
  );
}
