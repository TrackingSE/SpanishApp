import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { getDueCards } from '../lib/today';
import { STATE_LABEL } from '../lib/adaptive';

export function Settings() {
  const navigate = useNavigate();
  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);
  const resetAll = useAppStore((s) => s.resetAll);
  const reseed = useAppStore((s) => s.reseed);
  const profile = state.profile;

  const overall = Math.round(
    course.nodes.reduce((sum, n) => sum + (state.nodes[n.id]?.mastery ?? 0), 0) /
      course.nodes.length,
  );
  const passed = course.nodes.filter((n) => state.nodes[n.id]?.status === 'passed').length;
  const due = getDueCards(course, state).length;
  const studied = Object.values(state.cards).filter((c) => c.reps > 0 || c.recent.length > 0).length;

  const counts = [
    ['units', course.units.length],
    ['skills', course.nodes.length],
    ['vocabulary', course.vocab.length],
    ['grammar', course.grammar.length],
    ['flashcards', course.flashcards.length],
    ['input tasks', course.inputTasks.length],
    ['output tasks', course.outputTasks.length],
  ] as const;

  function handleReset() {
    if (window.confirm('Reset everything, including your profile? This cannot be undone.')) {
      resetAll();
      navigate('/onboarding');
    }
  }

  function handleReseed() {
    if (window.confirm('Wipe all study progress and reseed the course? Your profile stays.')) {
      reseed();
      navigate('/today');
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Profile, progress and developer tools." />

      <section className="card p-6">
        <h2 className="label">Profile</h2>
        {profile ? (
          <dl className="mt-3 divide-y divide-ink-200">
            <Row label="Language" value={profile.targetLanguage} />
            <Row label="First language" value={profile.nativeLanguage} />
            <Row label="Goal" value={profile.goal} />
            <Row label="Starting level" value={profile.startingLevel} />
            <Row label="Current level" value={profile.level} />
            <Row label="Time per day" value={`${profile.dailyMinutes} min`} />
            <Row label="Started" value={new Date(profile.createdAt).toLocaleDateString()} />
          </dl>
        ) : (
          <p className="mt-2 text-sm text-ink-600">No profile. Finish onboarding first.</p>
        )}
      </section>

      <section className="mt-6 card p-6">
        <h2 className="label">Progress</h2>
        <div className="mt-3">
          <div className="mb-1 flex justify-between font-mono text-[11px] text-ink-500">
            <span>course mastery</span>
            <span>{overall}%</span>
          </div>
          <ProgressBar value={overall} tone="moss" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="Passed" value={`${passed} / ${course.nodes.length}`} />
          <Stat label="Due" value={`${due}`} />
          <Stat label="Studied" value={`${studied}`} />
        </div>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="label">Course content</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
          {counts.map(([label, n]) => (
            <div key={label} className="flex justify-between font-mono text-sm">
              <dt className="text-ink-500">{label}</dt>
              <dd className="font-semibold text-ink-900">{n}</dd>
            </div>
          ))}
        </dl>

        <details className="mt-4">
          <summary className="label cursor-pointer select-none">Skill state calculations</summary>
          <div className="mt-2 max-h-72 overflow-auto border border-ink-200">
            <table className="w-full font-mono text-[11px]">
              <thead className="sticky top-0 bg-paper-dark text-ink-600">
                <tr>
                  <th className="px-2 py-1 text-left">skill</th>
                  <th className="px-2 py-1 text-right">mastery</th>
                  <th className="px-2 py-1 text-right">acc</th>
                  <th className="px-2 py-1 text-left">state</th>
                </tr>
              </thead>
              <tbody>
                {course.nodes.map((n) => {
                  const np = state.nodes[n.id];
                  return (
                    <tr key={n.id} className="border-t border-ink-200">
                      <td className="px-2 py-1 text-ink-800">{n.id}</td>
                      <td className="px-2 py-1 text-right">{np?.mastery ?? 0}%</td>
                      <td className="px-2 py-1 text-right">{np?.reviewAccuracy ?? 0}%</td>
                      <td className="px-2 py-1 text-ink-600">
                        {STATE_LABEL[np?.status ?? 'locked']}
                        {np?.weak ? ' · weak' : ''}
                        {np?.due ? ' · due' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="mt-6 card border-rust-500/40 p-6">
        <h2 className="label text-rust-700">Developer tools</h2>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink-900">Reseed course</p>
              <p className="text-xs text-ink-600">Wipe progress, keep profile, rebuild fresh records.</p>
            </div>
            <button
              onClick={handleReseed}
              className="btn border border-ink-300 bg-paper-card text-ink-800 hover:bg-paper-dark"
            >
              Reseed
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-ink-200 pt-3">
            <div>
              <p className="text-sm font-medium text-ink-900">Reset everything</p>
              <p className="text-xs text-ink-600">Clear profile and all data. Back to onboarding.</p>
            </div>
            <button
              onClick={handleReset}
              className="btn border border-rust-500 bg-rust-100 text-rust-700 hover:bg-rust-100"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <p className="mt-6 label text-center">all data is stored locally on this device.</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 text-sm">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ink-200 bg-paper p-3">
      <div className="font-serif text-xl font-semibold text-ink-900">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
