import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useLocalStorage('mutelearn-user', {
    name: '',
    gradeLevel: '',
    hasOnboarded: false,
  });

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const completeOnboarding = (name, gradeLevel) => {
    setUser((prev) => ({ ...prev, name, gradeLevel, hasOnboarded: true }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser, completeOnboarding }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
