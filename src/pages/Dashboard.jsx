import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useMode } from '../contexts/ModeContext';
import { useGamification } from '../contexts/GamificationContext';
import { useStudy } from '../contexts/StudyContext';
import { xpPerLevel, levelNames, encouragingMessages } from '../config/modeDefaults';

function StatCard({ icon, label, value, color = 'var(--color-primary)' }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label, description, color }) {
  return (
    <Link
      to={to}
      className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 block"
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform"
        style={{ backgroundColor: `${color}15` }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-gray-800 text-lg">{label}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </Link>
  );
}

function ActivityItem({ activity }) {
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const typeIcons = {
    session: '📖',
    quiz: '📝',
    game: '🎮',
    flashcard: '🃏',
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className="text-xl">{typeIcons[activity.type] || '📌'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate">
          {activity.description || `Completed a ${activity.type}`}
        </p>
        <p className="text-xs text-gray-400">{timeAgo(activity.date)}</p>
      </div>
      {activity.xpEarned && (
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full shrink-0">
          +{activity.xpEarned} XP
        </span>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useUser();
  const { modeConfig } = useMode();
  const { xp, level, streak, stats, sessionHistory } = useGamification();
  const { decks } = useStudy();

  const [encouragement, setEncouragement] = useState('');

  useEffect(() => {
    const msg = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
    setEncouragement(msg);
  }, []);

  const xpNeeded = xpPerLevel(level);
  const xpProgress = Math.round((xp / xpNeeded) * 100);
  const currentLevelName = levelNames[Math.min(level - 1, levelNames.length - 1)];

  const totalCardsDue = decks.reduce((sum, deck) => {
    const dueCards = deck.cards.filter((c) => {
      if (!c.sm2 || !c.sm2.nextReview) return true;
      return new Date(c.sm2.nextReview) <= new Date();
    });
    return sum + dueCards.length;
  }, 0);

  const recentActivity = sessionHistory.slice(-5).reverse();

  const firstName = user.name ? user.name.split(' ')[0] : 'Learner';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {firstName}!
          </h1>
          <p className="text-gray-500 mt-1">
            Level {level} {currentLevelName} &middot; Keep up the great work!
          </p>
        </div>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-3 rounded-2xl shadow-md">
          <p className="text-sm opacity-90">Today&apos;s XP</p>
          <p className="text-2xl font-bold">{xp} / {xpNeeded}</p>
        </div>
      </div>

      {/* Encouraging message */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-2xl">✨</span>
        <p className="text-amber-800 font-medium">{encouragement}</p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="🔥"
          label="Day Streak"
          value={streak.current}
          color="#ef4444"
        />
        <StatCard
          icon="🃏"
          label="Cards Due"
          value={totalCardsDue}
          color="#3b82f6"
        />
        <StatCard
          icon="📖"
          label="Sessions"
          value={stats.totalSessions}
          color="#8b5cf6"
        />
        <StatCard
          icon="🏆"
          label="Quizzes"
          value={stats.totalQuizzes}
          color="#f59e0b"
        />
      </div>

      {/* XP Progress Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Level {level} Progress</span>
          <span className="text-sm text-gray-400">{xp} / {xpNeeded} XP</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {xpNeeded - xp} XP until Level {level + 1}
          {level < levelNames.length && ` (${levelNames[level]})`}
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            to="/study"
            icon="📖"
            label="Study Session"
            description="Start a focused study session"
            color="#8b5cf6"
          />
          <QuickAction
            to="/flashcards"
            icon="🃏"
            label="Flashcards"
            description="Review your flashcard decks"
            color="#3b82f6"
          />
          <QuickAction
            to="/quiz"
            icon="📝"
            label="Take a Quiz"
            description="Test your knowledge"
            color="#10b981"
          />
          <QuickAction
            to="/games"
            icon="🎮"
            label="Play Games"
            description="Learn through fun games"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {recentActivity.map((activity, i) => (
              <ActivityItem key={activity.date + i} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">🌟</p>
            <p className="text-gray-500 font-medium">No activity yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Start your first study session to see your progress here!
            </p>
            <Link
              to="/study"
              className="inline-block mt-4 px-6 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
