import { useGamification } from '../contexts/GamificationContext';
import { badges } from '../config/badges';
import { levelNames, xpPerLevel } from '../config/modeDefaults';

function BadgeCard({ badge, unlocked }) {
  return (
    <div
      className={`rounded-2xl p-4 text-center transition-all ${
        unlocked
          ? 'bg-white shadow-sm border border-gray-100 hover:shadow-md'
          : 'bg-gray-50 border border-gray-100 opacity-50'
      }`}
    >
      <span className={`text-4xl block mb-2 ${unlocked ? '' : 'grayscale'}`}>
        {badge.icon}
      </span>
      <h4 className="font-bold text-gray-800 text-sm">{badge.name}</h4>
      <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
      {unlocked && (
        <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
          Unlocked
        </span>
      )}
    </div>
  );
}

function WeeklyChart({ sessionHistory }) {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });

    const sessionsOnDay = sessionHistory.filter(
      (s) => s.date && s.date.startsWith(dateStr)
    );

    last7Days.push({
      label: dayLabel,
      count: sessionsOnDay.length,
      date: dateStr,
    });
  }

  const maxCount = Math.max(...last7Days.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-2 h-32 px-2">
      {last7Days.map((day) => (
        <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-gray-600">{day.count}</span>
          <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '100px' }}>
            <div
              className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-purple-400 rounded-t-lg transition-all duration-500"
              style={{
                height: `${day.count > 0 ? (day.count / maxCount) * 100 : 4}%`,
                minHeight: day.count > 0 ? '8px' : '2px',
              }}
            />
          </div>
          <span className="text-xs text-gray-500">{day.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProgressPage() {
  const { xp, level, streak, stats, unlockedBadges, sessionHistory } = useGamification();

  const xpNeeded = xpPerLevel(level);
  const xpProgress = Math.round((xp / xpNeeded) * 100);
  const currentLevelName = levelNames[Math.min(level - 1, levelNames.length - 1)];
  const nextLevelName = level < levelNames.length ? levelNames[level] : 'Max Level';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Your Progress</h1>
        <p className="text-gray-500 mt-1">Track your learning journey</p>
      </div>

      {/* Level & XP */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium">Current Level</p>
            <h2 className="text-4xl font-bold mt-1">Level {level}</h2>
            <p className="text-indigo-200 mt-1">{currentLevelName}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-sm">Total XP Earned</p>
            <p className="text-3xl font-bold">{xp + (level - 1) * 100}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm text-indigo-200 mb-2">
            <span>Progress to Level {level + 1}</span>
            <span>{xp} / {xpNeeded} XP</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-xs text-indigo-200 mt-2">
            {xpNeeded - xp} XP until {nextLevelName}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
          <span className="text-3xl block mb-2">🔥</span>
          <p className="text-3xl font-bold text-gray-800">{streak.current}</p>
          <p className="text-sm text-gray-500">Current Streak</p>
          <p className="text-xs text-gray-400 mt-1">Best: {streak.longest}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
          <span className="text-3xl block mb-2">📖</span>
          <p className="text-3xl font-bold text-gray-800">{stats.totalSessions}</p>
          <p className="text-sm text-gray-500">Study Sessions</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
          <span className="text-3xl block mb-2">🃏</span>
          <p className="text-3xl font-bold text-gray-800">{stats.totalCardsReviewed}</p>
          <p className="text-sm text-gray-500">Cards Reviewed</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
          <span className="text-3xl block mb-2">📝</span>
          <p className="text-3xl font-bold text-gray-800">{stats.totalQuizzes}</p>
          <p className="text-sm text-gray-500">Quizzes Taken</p>
          {stats.perfectQuizzes > 0 && (
            <p className="text-xs text-amber-500 mt-1">{stats.perfectQuizzes} perfect</p>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <span className="text-3xl">🎮</span>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalGames}</p>
            <p className="text-sm text-gray-500">Games Played</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.overloadSessions}</p>
            <p className="text-sm text-gray-500">Overload Sessions</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <span className="text-3xl">🎯</span>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.pacingCompleted}</p>
            <p className="text-sm text-gray-500">Pacing Completed</p>
          </div>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Activity</h2>
        <WeeklyChart sessionHistory={sessionHistory} />
        <p className="text-xs text-gray-400 text-center mt-3">Sessions per day (last 7 days)</p>
      </div>

      {/* Streak History */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Streak Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-orange-500">{streak.current}</p>
            <p className="text-sm text-gray-500 mt-1">Current Streak</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-amber-500">{streak.longest}</p>
            <p className="text-sm text-gray-500 mt-1">Longest Streak</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">
              {streak.lastStudyDate
                ? `Last studied: ${new Date(streak.lastStudyDate).toLocaleDateString()}`
                : 'No study sessions yet'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Last Active</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Badges</h2>
          <span className="text-sm text-gray-500">
            {unlockedBadges.length} / {badges.length} unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {badges.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              unlocked={unlockedBadges.includes(badge.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
