import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { CEFRLevel } from '../types';

const LEVELS: { value: CEFRLevel; label: string }[] = [
  { value: 'A1', label: 'Beginner' },
  { value: 'A2', label: 'Elementary' },
  { value: 'B1', label: 'Intermediate' },
  { value: 'B2', label: 'Upper' },
];

const GOALS = ['Travel', 'Talking to people', 'Work', 'Exams'];
const MINUTES = [5, 10, 15, 20, 30];

export function Onboarding() {
  const navigate = useNavigate();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [goal, setGoal] = useState(GOALS[0]);
  const [level, setLevel] = useState<CEFRLevel>('A1');
  const [dailyMinutes, setDailyMinutes] = useState(10);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    completeOnboarding({ targetLanguage, nativeLanguage, goal, level, dailyMinutes });
    navigate('/today');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center border border-ink-900 bg-ink-900 font-mono text-xs font-semibold text-paper">
            ES
          </span>
          <span className="label">Field Spanish · A1</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Set up your course</h1>
        <p className="mt-2 text-sm text-ink-600">
          This sets your starting point and how much you study. You can change it later in Settings.
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GOALS.map((g) => (
              <Choice key={g} active={goal === g} onClick={() => setGoal(g)}>
                {g}
              </Choice>
            ))}
          </div>
        </Field>

        <Field label="Current level">
          <div className="grid grid-cols-4 gap-2">
            {LEVELS.map((l) => (
              <Choice key={l.value} active={level === l.value} onClick={() => setLevel(l.value)}>
                <span className="font-mono">{l.value}</span>
                <span className="mt-0.5 block text-[11px] text-ink-500">{l.label}</span>
              </Choice>
            ))}
          </div>
        </Field>

        <Field label="Time per day">
          <div className="flex flex-wrap gap-2">
            {MINUTES.map((m) => (
              <Choice key={m} active={dailyMinutes === m} onClick={() => setDailyMinutes(m)} compact>
                {m} min
              </Choice>
            ))}
          </div>
        </Field>

        <button type="submit" className="btn-primary w-full">
          Start the course
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
