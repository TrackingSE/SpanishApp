import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { CEFRLevel } from '../types';
import { LEVEL_ORDER, levelIndex } from '../data/spanish';
import { nextLevel } from '../lib/levels';

const LEVELS: { value: CEFRLevel; label: string; note: string }[] = [
  { value: 'A1', label: 'Complete beginner', note: 'Start from zero' },
  { value: 'A1', label: 'A1', note: 'A few basics' },
  { value: 'A2', label: 'A2', note: 'Simple exchanges' },
  { value: 'B1', label: 'B1', note: 'Independent' },
  { value: 'B2', label: 'B2', note: 'Confident' },
  { value: 'C1', label: 'C1', note: 'Advanced' },
  { value: 'C2', label: 'C2 maintenance', note: 'Keep it sharp' },
];

const GOALS = ['Travel', 'Work', 'Exam', 'Conversation', 'Reading', 'Full fluency'];

const MINUTES: { value: number; label: string }[] = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
];

export function Onboarding() {
  const navigate = useNavigate();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [goal, setGoal] = useState(GOALS[0]);
  const [levelChoice, setLevelChoice] = useState(0);
  const [dailyMinutes, setDailyMinutes] = useState(30);

  const startingLevel = LEVELS[levelChoice].value;
  const startIdx = levelIndex(startingLevel);
  const lowerLevels = LEVEL_ORDER.slice(0, startIdx);
  const higherLevels = LEVEL_ORDER.slice(startIdx + 1);
  const next = nextLevel(startingLevel);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    completeOnboarding({ targetLanguage, nativeLanguage, goal, startingLevel, dailyMinutes });
    navigate('/today');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center border border-ink-900 bg-ink-900 font-mono text-xs font-semibold text-paper">
            ES
          </span>
          <span className="label">Field Spanish · A1 → C2</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Place yourself</h1>
        <p className="mt-2 text-sm text-ink-600">
          Tell us where you are and how much time you have. We set the path; you do the work. You can
          change this later in Settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        <Field label="Language">
          <select
            className="input-field"
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
          >
            <option value="Spanish">Spanish</option>
            <option value="French" disabled>
              French (not built yet)
            </option>
          </select>
        </Field>

        <Field label="Your first language">
          <select
            className="input-field"
            value={nativeLanguage}
            onChange={(e) => setNativeLanguage(e.target.value)}
          >
            <option>English</option>
            <option>French</option>
            <option>German</option>
            <option>Portuguese</option>
          </select>
        </Field>

        <Field label="Why you are learning">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GOALS.map((gOpt) => (
              <Choice key={gOpt} active={goal === gOpt} onClick={() => setGoal(gOpt)}>
                {gOpt}
              </Choice>
            ))}
          </div>
        </Field>

        <Field label="Where you are now">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LEVELS.map((l, i) => (
              <Choice key={l.label} active={levelChoice === i} onClick={() => setLevelChoice(i)}>
                <span className="font-mono">{l.label}</span>
                <span className="mt-0.5 block text-[11px] text-ink-500">{l.note}</span>
              </Choice>
            ))}
          </div>
        </Field>

        <Field label="Time per day">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MINUTES.map((m) => (
              <Choice
                key={m.value}
                active={dailyMinutes === m.value}
                onClick={() => setDailyMinutes(m.value)}
                compact
              >
                {m.label}
              </Choice>
            ))}
          </div>
        </Field>

        {/* Placement preview */}
        <div className="border border-ink-300 bg-paper p-4">
          <p className="label">Your placement</p>
          <p className="mt-1 font-serif text-lg font-semibold text-ink-900">
            Start at {startingLevel}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink-700">
            {next && (
              <li>
                · We will test {startingLevel} before moving you to {next}.
              </li>
            )}
            {lowerLevels.length > 0 && (
              <li>· Lower levels ({lowerLevels.join(', ')}) are assumed, not ignored.</li>
            )}
            {lowerLevels.length > 0 && <li>· Failed skills become repair work.</li>}
            {higherLevels.length > 0 && (
              <li className="text-ink-500">· Locked until earned: {higherLevels.join(', ')}.</li>
            )}
            <li>· We recommend the {startingLevel} diagnostic test first.</li>
            <li className="text-ink-500">· Long-term target: C2.</li>
          </ul>
        </div>

        <button type="submit" className="btn-primary w-full">
          Start at {startingLevel}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-ink-500">
        Everything is saved on this device. No account, no server.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function Choice({
  active,
  onClick,
  children,
  compact,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border text-center text-sm font-medium transition ${
        compact ? 'px-4 py-2' : 'px-3 py-2.5'
      } ${
        active
          ? 'border-ink-900 bg-ink-900 text-paper'
          : 'border-ink-300 bg-paper-card text-ink-700 hover:border-ink-500'
      }`}
    >
      {children}
    </button>
  );
}
