import { createContext, useContext, useState, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { badges } from '../config/badges';
import { xpPerLevel } from '../config/modeDefaults';

const GamificationContext = createContext();

export function GamificationProvider({ children }) {
  const [gamification, setGamification] = useLocalStorage('mutelearn-gamification', {
    xp: 0,
    level: 1,
    totalXpEarned: 0,
    streak: { current: 0, longest: 0, lastStudyDate: null },
    unlockedBadges: [],
    stats: {
      totalSessions: 0,
      totalCardsReviewed: 0,
      totalQuizzes: 0,
      perfectQuizzes: 0,
      totalGames: 0,
      totalImports: 0,
      overloadSessions: 0,
      pacingCompleted: 0,
      studiedLateNight: false,
      studiedEarlyMorning: false,
    },
    sessionHistory: [],
  });

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newBadge, setNewBadge] = useState(null);
  const [xpPopup, setXpPopup] = useState(null);

  const addXP = useCallback((amount, reason = '') => {
    setXpPopup({ amount, reason });
    setTimeout(() => setXpPopup(null), 2000);

    setGamification((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      const neededForNext = xpPerLevel(newLevel);

      while (newXp >= neededForNext) {
        newXp -= xpPerLevel(newLevel);
        newLevel++;
      }

      if (newLevel > prev.level) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        totalXpEarned: prev.totalXpEarned + amount,
      };
    });
  }, [setGamification]);

  const updateStreak = useCallback(() => {
    setGamification((prev) => {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = prev.streak.lastStudyDate;

      if (lastDate === today) return prev;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const newCurrent = lastDate === yesterdayStr ? prev.streak.current + 1 : 1;
      const newLongest = Math.max(newCurrent, prev.streak.longest);

      return {
        ...prev,
        streak: { current: newCurrent, longest: newLongest, lastStudyDate: today },
      };
    });
  }, [setGamification]);

  const updateStats = useCallback((statUpdates) => {
    setGamification((prev) => {
      const newStats = { ...prev.stats };
      Object.entries(statUpdates).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          newStats[key] = value;
        } else {
          newStats[key] = (newStats[key] || 0) + value;
        }
      });

      // Check time-based badges
      const hour = new Date().getHours();
      if (hour >= 21) newStats.studiedLateNight = true;
      if (hour < 7) newStats.studiedEarlyMorning = true;

      return { ...prev, stats: newStats };
    });
  }, [setGamification]);

  const checkBadges = useCallback(() => {
    setGamification((prev) => {
      const statsWithLevel = { ...prev.stats, level: prev.level, currentStreak: prev.streak.current };
      const newUnlocks = badges.filter(
        (badge) =>
          !prev.unlockedBadges.includes(badge.id) && badge.check(statsWithLevel)
      );

      if (newUnlocks.length > 0) {
        setNewBadge(newUnlocks[0]);
        setTimeout(() => setNewBadge(null), 3000);
        return {
          ...prev,
          unlockedBadges: [...prev.unlockedBadges, ...newUnlocks.map((b) => b.id)],
        };
      }
      return prev;
    });
  }, [setGamification]);

  const addSessionHistory = useCallback((session) => {
    setGamification((prev) => ({
      ...prev,
      sessionHistory: [
        ...prev.sessionHistory.slice(-99),
        { ...session, date: new Date().toISOString() },
      ],
    }));
  }, [setGamification]);

  const dismissLevelUp = () => setShowLevelUp(false);
  const dismissBadge = () => setNewBadge(null);

  return (
    <GamificationContext.Provider
      value={{
        ...gamification,
        addXP,
        updateStreak,
        updateStats,
        checkBadges,
        addSessionHistory,
        showLevelUp,
        newBadge,
        xpPopup,
        dismissLevelUp,
        dismissBadge,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) throw new Error('useGamification must be used within GamificationProvider');
  return context;
}
