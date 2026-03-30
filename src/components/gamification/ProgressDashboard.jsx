import React, { useMemo } from 'react';
import { useGamification } from '../../contexts/GamificationContext';
import { xpPerLevel, levelNames } from '../../config/modeDefaults';
import Card from '../shared/Card';
import CircularProgress from '../shared/CircularProgress';
import XPBar from './XPBar';
import StreakDisplay from './StreakDisplay';
import BadgeGrid from './BadgeGrid';

function getWeeklyData(sessionHistory) {
  const days = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

    const daySessions = sessionHistory.filter((s) => {
      const sDate = new Date(s.date).toISOString().split('T')[0];
      return sDate === dateStr;
    });

    days.push({
      label: dayLabel,
      count: daySessions.length,
      date: dateStr,
      isToday: i === 0,
    });
  }

  return days;
}

function getTotalStudyTime(sessionHistory) {
  const totalMinutes = sessionHistory.reduce(
    (sum, s) => sum + (s.duration || 0),
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function ProgressDashboard() {
  const { xp, level, stats, sessionHistory, streak } = useGamification();
  const needed = xpPerLevel(level);
  const percent = Math.min(100, (xp / needed) * 100);
  const levelName = levelNames[level - 1] || levelNames[levelNames.length - 1];

  const weeklyData = useMemo(() => getWeeklyData(sessionHistory), [sessionHistory]);
  const maxDayCount = Math.max(1, ...weeklyData.map((d) => d.count));
  const totalStudyTime = useMemo(() => getTotalStudyTime(sessionHistory), [sessionHistory]);

  const statItems = [
    { label: 'Sessions', value: stats.totalSessions, icon: '\uD83D\uDCDA' },
    { label: 'Cards Reviewed', value: stats.totalCardsReviewed, icon: '\uD83C\uDCCF' },
    { label: 'Quizzes Taken', value: stats.totalQuizzes, icon: '\uD83D\uDCDD' },
    { label: 'Games Played', value: stats.totalGames, icon: '\uD83C\uDFAE' },
  ];

  return (
    <div className="space-y-6">
      {/* Level Progress Section */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Circular level display */}
          <div className="flex-shrink-0">
            <CircularProgress value={percent} size={140} strokeWidth={10}>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-[var(--text-primary,#111827)]">
                  {level}
                </p>
                <p className="text-[10px] font-medium text-[var(--text-secondary,#6b7280)] uppercase tracking-wider">
                  Level
                </p>
              </div>
            </CircularProgress>
          </div>

          {/* Level details */}
          <div className="flex-1 w-full text-center sm:text-left">
            <h2 className="text-xl font-bold text-[var(--text-primary,#111827)] mb-0.5">
              {levelName}
            </h2>
            <p className="text-sm text-[var(--text-secondary,#6b7280)] mb-3">
              {xp} / {needed} XP to Level {level + 1}
            </p>
            <XPBar />
          </div>
        </div>
      </Card>

      {/* Streak + Study Time Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="flex flex-col items-center justify-center">
          <StreakDisplay />
        </Card>

        <Card className="flex flex-col items-center justify-center">
          <div className="text-center">
            <span className="text-4xl mb-2 inline-block">{'\u23F1\uFE0F'}</span>
            <p className="text-3xl font-extrabold text-[var(--text-primary,#111827)] mb-1">
              {totalStudyTime}
            </p>
            <p className="text-sm text-[var(--text-secondary,#6b7280)]">
              Total Study Time
            </p>
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statItems.map((item) => (
          <Card key={item.label} padding="sm" className="text-center">
            <span className="text-2xl mb-1 inline-block">{item.icon}</span>
            <p className="text-2xl font-bold text-[var(--text-primary,#111827)] tabular-nums">
              {item.value}
            </p>
            <p className="text-xs text-[var(--text-secondary,#6b7280)]">
              {item.label}
            </p>
          </Card>
        ))}
      </div>

      {/* Weekly Activity Chart */}
      <Card>
        <h3 className="text-base font-bold text-[var(--text-primary,#111827)] mb-4">
          This Week
        </h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {weeklyData.map((day) => (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              {/* Count label */}
              <span className="text-xs font-semibold text-[var(--text-secondary,#6b7280)] tabular-nums">
                {day.count > 0 ? day.count : ''}
              </span>
              {/* Bar */}
              <div className="w-full flex flex-col justify-end h-20">
                <div
                  className="w-full rounded-t-md transition-all duration-500 ease-out"
                  style={{
                    height:
                      day.count > 0
                        ? `${Math.max(12, (day.count / maxDayCount) * 100)}%`
                        : '4px',
                    background:
                      day.count > 0
                        ? day.isToday
                          ? 'linear-gradient(to top, var(--accent, #6366f1), #a78bfa)'
                          : 'var(--accent, #6366f1)'
                        : 'var(--border, #e5e7eb)',
                    opacity: day.count > 0 ? (day.isToday ? 1 : 0.6) : 0.3,
                  }}
                />
              </div>
              {/* Day label */}
              <span
                className={[
                  'text-xs',
                  day.isToday
                    ? 'font-bold text-[var(--accent,#6366f1)]'
                    : 'text-[var(--text-secondary,#6b7280)]',
                ].join(' ')}
              >
                {day.label}
              </span>
            </div>
          ))}
        </div>
        {sessionHistory.length === 0 && (
          <p className="text-center text-sm text-[var(--text-secondary,#6b7280)] mt-3">
            Complete a study session to see your activity here!
          </p>
        )}
      </Card>

      {/* Badge Collection */}
      <Card>
        <BadgeGrid />
      </Card>
    </div>
  );
}
