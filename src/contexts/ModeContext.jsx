import { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { modeDefaults } from '../config/modeDefaults';

const ModeContext = createContext();

export function ModeProvider({ children }) {
  const [mode, setMode] = useLocalStorage('mutelearn-mode', 'default');
  const [customSettings, setCustomSettings] = useLocalStorage('mutelearn-mode-settings', {});

  const modeConfig = {
    ...modeDefaults[mode],
    ...customSettings[mode],
  };

  useEffect(() => {
    document.documentElement.className = `mode-${mode}`;
  }, [mode]);

  const switchMode = (newMode) => {
    if (modeDefaults[newMode]) {
      setMode(newMode);
    }
  };

  const updateModeConfig = (overrides) => {
    setCustomSettings((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], ...overrides },
    }));
  };

  return (
    <ModeContext.Provider value={{ mode, modeConfig, switchMode, updateModeConfig }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) throw new Error('useMode must be used within ModeProvider');
  return context;
}
