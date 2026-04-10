import { NavLink } from 'react-router-dom';
import { useMode } from '../../contexts/ModeContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/planner', label: 'Planner', icon: '🗓️' },
  { to: '/courses', label: 'Courses', icon: '🎒' },
  { to: '/flashcards', label: 'Flashcards', icon: '🃏' },
  { to: '/study', label: 'Study Session', icon: '⏱️' },
  { to: '/study-packs', label: 'Study Packs', icon: '📦' },
  { to: '/notes', label: 'Notes', icon: '📝' },
  { to: '/quizzes', label: 'Quizzes', icon: '❓' },
  { to: '/games', label: 'Games', icon: '🎮' },
  { to: '/progress', label: 'Progress', icon: '📊' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ onClose }) {
  const { mode } = useMode();

  return (
    <aside
      className="flex flex-col h-full w-64 border-r"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo area */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
          🔇 MuteLearn
        </span>
        {/* Close button for mobile overlay */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive ? 'shadow-sm' : 'hover:opacity-80'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--accent)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-primary)',
            })}
          >
            <span className="text-lg" role="img" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Mode indicator at bottom */}
      <div
        className="px-4 py-3 border-t text-xs"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        <span className="opacity-70">Mode:</span>{' '}
        <span className="font-semibold capitalize">{mode}</span>
      </div>
    </aside>
  );
}
