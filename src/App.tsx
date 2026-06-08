import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { Layout } from './components/Layout';
import { Onboarding } from './pages/Onboarding';
import { Today } from './pages/Today';
import { Roadmap } from './pages/Roadmap';
import { LevelDetail } from './pages/LevelDetail';
import { Lesson } from './pages/Lesson';
import { Review } from './pages/Review';
import { InputTask } from './pages/InputTask';
import { OutputTask } from './pages/OutputTask';
import { Assessment } from './pages/Assessment';
import { Diagnostic } from './pages/Diagnostic';
import { Pronunciation } from './pages/Pronunciation';
import { Settings } from './pages/Settings';

export default function App() {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);
  const onboarded = useAppStore((s) => s.state.profile?.onboarded ?? false);
  const location = useLocation();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center text-sm font-semibold text-ink-400">
        Loading…
      </div>
    );
  }

  // Onboarding gate.
  if (!onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  if (onboarded && location.pathname === '/onboarding') {
    return <Navigate to="/today" replace />;
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<Layout />}>
        <Route path="/today" element={<Today />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/level/:levelId" element={<LevelDetail />} />
        <Route path="/lesson/:nodeId" element={<Lesson />} />
        <Route path="/review" element={<Review />} />
        <Route path="/input/:taskId" element={<InputTask />} />
        <Route path="/output/:taskId" element={<OutputTask />} />
        <Route path="/assessment/:levelId" element={<Assessment />} />
        <Route path="/diagnostic/:attemptId" element={<Diagnostic />} />
        <Route path="/pronunciation" element={<Pronunciation />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to={onboarded ? '/today' : '/onboarding'} replace />} />
    </Routes>
  );
}
