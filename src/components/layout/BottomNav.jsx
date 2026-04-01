import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/planner', label: 'Plan', icon: '🗓️' },
  { to: '/courses', label: 'Courses', icon: '🎒' },
  { to: '/quizzes', label: 'Quiz', icon: '❓' },
  { to: '/study-packs', label: 'Packs', icon: '📦' },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t lg:hidden"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-2 px-3 text-[11px] font-medium transition-colors min-w-[56px] ${
              isActive ? '' : 'opacity-60'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
          })}
        >
          <span className="text-xl" role="img" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
