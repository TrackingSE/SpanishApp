import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PageHeader } from '../components/PageHeader';
import { assessmentForLevel } from '../data/buildCourse';
import { retestAllowed, sessionsUntilRetest } from '../lib/levels';
import { LEVEL_ORDER } from '../data/spanish';
import type { AssessmentAnswer, AssessmentQuestion, CEFRLevel } from '../types';

type Draft = Omit<AssessmentAnswer, 'result'>;

function emptyDraft(id: string): Draft {
  return {
    questionId: id,
    userAnswer: '',
    markedUnknown: false,
    markedGuessed: false,
    flagged: false,
    timeSpentSeconds: 0,
  };
}

export function Assessment() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);
  const submitAssessment = useAppStore((s) => s.submitAssessment);

  const level = (LEVEL_ORDER.includes(levelId as CEFRLevel) ? levelId : null) as CEFRLevel | null;
  const assessment = level ? assessmentForLevel(course, level) : undefined;
  const startedAt = useRef(new Date().toISOString());

  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    assessment ? Object.fromEntries(assessment.questions.map((q) => [q.id, emptyDraft(q.id)])) : {},
  );
  const [confirming, setConfirming] = useState(false);

  const answeredCount = useMemo(
    () =>
      Object.values(drafts).filter(
        (d) => d.userAnswer.trim() || d.markedUnknown || d.flagged,
      ).length,
    [drafts],
  );

  if (!level || !assessment) {
    return (
      <div className="card p-8 text-center text-ink-600">
        Assessment not found.{' '}
        <Link to="/roadmap" className="font-medium underline">
          Back to roadmap
        </Link>
      </div>
    );
  }

  const blocked = !retestAllowed(state, level);
  const retestIn = sessionsUntilRetest(state, level);

  if (blocked) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title={assessment.title} back={`/level/${level}`} />
        <div className="card p-8 text-center">
          <span className="tag tag-rust mx-auto">retest blocked</span>
          <p className="mt-3 font-serif text-lg text-ink-900">Not yet. Do the repair work first.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-600">
            You need {retestIn} more study session{retestIn === 1 ? '' : 's'} — at least one review
            session and one input or output task on your weak areas — before retesting {level}.
          </p>
          <Link to={`/level/${level}`} className="btn-primary mt-5 inline-flex">
            Go to repair queue
          </Link>
        </div>
      </div>
    );
  }

  function update(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function handleSubmit() {
    const answers: AssessmentAnswer[] = Object.values(drafts).map((d) => ({
      ...d,
      result: 'skipped',
    }));
    const attemptId = submitAssessment(level!, answers, startedAt.current);
    if (attemptId) navigate(`/diagnostic/${attemptId}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={assessment.title}
        subtitle="Difficult by design. Be honest: mark what you guessed or did not know."
        back={`/level/${level}`}
      />

      <div className="mb-4 border border-ink-300 bg-paper p-3 text-sm text-ink-700">
        Type real answers — most questions are not multiple choice. Use the buttons under each item to
        mark <strong>I don't know</strong>, <strong>I guessed</strong>, or <strong>flag for review</strong>.
        These shape your diagnosis. No fake passes.
      </div>

      <div className="space-y-6">
        {assessment.sections.map((section) => (
          <section key={section.id} className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-ink-900">{section.title}</h2>
              <span className="label">{section.questionIds.length} items</span>
            </div>
            <p className="mt-1 text-sm text-ink-600">{section.instructions}</p>

            <div className="mt-4 space-y-5">
              {section.questionIds.map((qid, i) => {
                const q = assessment.questions.find((x) => x.id === qid)!;
                return (
                  <Question
                    key={qid}
                    index={i + 1}
                    q={q}
                    draft={drafts[qid]}
                    onChange={(patch) => update(qid, patch)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 card p-5 text-center">
        <p className="text-sm text-ink-600">
          {answeredCount} of {assessment.questions.length} items touched.
        </p>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="btn-primary mt-3">
            Finish and grade
          </button>
        ) : (
          <div className="mt-3">
            <p className="text-sm font-medium text-ink-900">
              Submit for grading? You cannot edit answers after this.
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <button onClick={() => setConfirming(false)} className="btn-secondary">
                Keep editing
              </button>
              <button onClick={handleSubmit} className="btn-primary">
                Grade it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Question({
  index,
  q,
  draft,
  onChange,
}: {
  index: number;
  q: AssessmentQuestion;
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
}) {
  const isWriting = q.type === 'writing_response';
  const isSpeaking = q.type === 'speaking_prompt';
  const isListening = q.section === 'listening';

  return (
    <div className="border-t border-ink-200 pt-4 first:border-0 first:pt-0">
      <p className="font-medium text-ink-900">
        {index}. {q.prompt}
      </p>

      {q.passage && (
        <div className="mt-2 border border-ink-200 bg-paper p-3 text-sm">
          {isListening && (
            <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-ochre-700">
              ♪ audio placeholder — read once, then answer from memory
            </p>
          )}
          <p className="font-serif text-ink-900">{q.passage}</p>
        </div>
      )}

      {isSpeaking ? (
        <button
          type="button"
          onClick={() => onChange({ userAnswer: draft.userAnswer === 'complete' ? '' : 'complete', markedUnknown: false })}
          className={`mt-3 btn ${
            draft.userAnswer === 'complete'
              ? 'border-moss-500 bg-moss-100 text-moss-700'
              : 'border-ink-300 bg-paper-card text-ink-800 hover:border-ink-500'
          }`}
        >
          {draft.userAnswer === 'complete' ? 'Spoken aloud ✓' : 'I spoke it aloud — mark complete'}
        </button>
      ) : isWriting ? (
        <textarea
          className="input-field mt-3 min-h-[120px] resize-y text-base leading-relaxed"
          placeholder="Write your response in Spanish"
          value={draft.userAnswer}
          disabled={draft.markedUnknown}
          onChange={(e) => onChange({ userAnswer: e.target.value })}
        />
      ) : (
        <input
          className="input-field mt-3"
          placeholder="Type your answer"
          value={draft.userAnswer}
          disabled={draft.markedUnknown}
          onChange={(e) => onChange({ userAnswer: e.target.value })}
        />
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Toggle
          active={draft.markedUnknown}
          tone="rust"
          onClick={() => onChange({ markedUnknown: !draft.markedUnknown, userAnswer: '' })}
        >
          I don't know
        </Toggle>
        {!isSpeaking && (
          <Toggle
            active={draft.markedGuessed}
            tone="ochre"
            onClick={() => onChange({ markedGuessed: !draft.markedGuessed })}
          >
            I guessed
          </Toggle>
        )}
        <Toggle
          active={draft.flagged}
          tone="ink"
          onClick={() => onChange({ flagged: !draft.flagged })}
        >
          Flag for review
        </Toggle>
      </div>
    </div>
  );
}

function Toggle({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: 'rust' | 'ochre' | 'ink';
  onClick: () => void;
  children: React.ReactNode;
}) {
  const activeCls =
    tone === 'rust'
      ? 'border-rust-500 bg-rust-100 text-rust-700'
      : tone === 'ochre'
        ? 'border-ochre-500 bg-ochre-100 text-ochre-700'
        : 'border-ink-900 bg-ink-900 text-paper';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm border px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-wider transition ${
        active ? activeCls : 'border-ink-300 bg-paper-card text-ink-600 hover:border-ink-500'
      }`}
    >
      {children}
    </button>
  );
}
