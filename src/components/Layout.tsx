import { NavLink, Outlet } from 'react-router-dom';
import { DebugPanel } from './DebugPanel';
import { useAppStore } from '../store/useAppStore';
import { computeLevels } from '../lib/levels';

const navItems = [
  { to: '/today', label: 'Today' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/review', label: 'Review' },
  { to: '/pronunciation', label: 'Pronunciation' },
  { to: '/settings', label: 'Settings' },
];

export function Layout() {
  const course = useAppStore((s) => s.course());
  const state = useAppStore((s) => s.state);
  const { currentLevel } = computeLevels(course, state);
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-ink-300 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/today" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center border border-ink-900 bg-ink-900 font-mono text-xs font-semibold text-paper">
              ES
            </span>
            <span className="font-serif text-lg font-semibold tracking-tight text-ink-900">
              Field Spanish
            </span>
            <span className="tag tag-ink hidden sm:inline-flex">{currentLevel}</span>
          </NavLink>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `border-b-2 px-2.5 py-1 text-sm font-medium transition ${
                    isActive
                      ? 'border-ink-900 text-ink-900'
                      : 'border-transparent text-ink-500 hover:text-ink-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <DebugPanel />
    </div>
  );
}
