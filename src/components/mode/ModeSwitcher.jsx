import { useMode } from '../../contexts/ModeContext';
import { modeDefaults } from '../../config/modeDefaults';

const modeKeys = Object.keys(modeDefaults);

export default function ModeSwitcher({ onClose }) {
  const { mode, switchMode } = useMode();

  const handleSelect = (key) => {
    switchMode(key);
    onClose?.();
  };

  return (
    <div
      className="w-72 rounded-xl shadow-xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      <div
        className="px-4 py-3 border-b text-sm font-semibold"
        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
      >
        Study Mode
      </div>

      <div className="p-2 space-y-1">
        {modeKeys.map((key) => {
          const def = modeDefaults[key];
          const isActive = mode === key;

          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 ${
                isActive ? 'ring-2' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: isActive ? 'var(--bg-primary)' : 'transparent',
                ringColor: isActive ? 'var(--accent)' : undefined,
                '--tw-ring-color': isActive ? 'var(--accent)' : undefined,
              }}
            >
              <span className="text-2xl mt-0.5" role="img" aria-hidden="true">
                {def.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {def.label}
                  </span>
                  {isActive && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: '#ffffff',
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <p
                  className="text-xs mt-0.5 leading-snug"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {def.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
