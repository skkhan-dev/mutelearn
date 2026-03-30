import React, { useMemo } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import ProgressBar from '../shared/ProgressBar';
import EncouragingMessage from '../shared/EncouragingMessage';

const ENCOURAGING_MESSAGES_BY_PROGRESS = [
  { max: 0.2, messages: ['Every journey starts with day one. You got this!', 'Starting strong is half the battle!'] },
  { max: 0.4, messages: ['Nice momentum! Keep building those study habits.', 'You\'re getting into a great rhythm!'] },
  { max: 0.6, messages: ['Halfway there! Your future self is thanking you.', 'Over the hump! The finish line is in sight.'] },
  { max: 0.8, messages: ['The home stretch! Your hard work is paying off.', 'Almost there! You\'ve been incredible.'] },
  { max: 1.0, messages: ['Final push! You\'re going to crush this exam!', 'You\'ve put in the work. Trust your preparation!'] },
];

function getEncouragingMessage(progress) {
  const tier = ENCOURAGING_MESSAGES_BY_PROGRESS.find((t) => progress <= t.max)
    || ENCOURAGING_MESSAGES_BY_PROGRESS[ENCOURAGING_MESSAGES_BY_PROGRESS.length - 1];
  return tier.messages[Math.floor(Math.random() * tier.messages.length)];
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function DailyCheckin({ plan, currentDay, onStartTask }) {
  const days = plan?.days || [];
  const totalDays = days.length;
  const todayPlan = days.find((d) => d.day === currentDay);
  const yesterdayPlan = days.find((d) => d.day === currentDay - 1);
  const progress = totalDays > 0 ? currentDay / totalDays : 0;
  const completedDays = days.filter((d) => d.completed).length;

  const encouragement = useMemo(() => getEncouragingMessage(progress), [progress]);

  if (!todayPlan) {
    return (
      <Card className="text-center space-y-3">
        <p className="text-lg font-semibold text-[var(--text-primary,#111827)]">
          No plan for today
        </p>
        <p className="text-sm text-[var(--text-secondary,#6b7280)]">
          Create a study plan to see your daily assignments.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      {/* Day header */}
      <div
        className="rounded-xl p-5 text-white text-center"
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
        }}
      >
        <p className="text-sm opacity-80 mb-1">{formatDate(todayPlan.date)}</p>
        <h2 className="text-2xl font-bold">
          Day {currentDay} of {totalDays}
        </h2>
        <p className="text-sm opacity-80 mt-1">
          {plan.deckNames?.join(', ')}
        </p>
      </div>

      {/* Milestone progress */}
      <Card>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-[var(--text-primary,#111827)]">
              Overall Progress
            </span>
            <span className="text-[var(--text-secondary,#6b7280)]">
              {completedDays} of {totalDays} days completed
            </span>
          </div>
          <ProgressBar
            value={Math.round((completedDays / totalDays) * 100)}
            color="#10b981"
            height={10}
          />
          {/* Day dots */}
          <div className="flex gap-1 flex-wrap mt-2">
            {days.map((d) => (
              <div
                key={d.day}
                className="w-3 h-3 rounded-full transition-colors"
                title={`Day ${d.day}`}
                style={{
                  backgroundColor:
                    d.day === currentDay
                      ? '#10b981'
                      : d.completed
                        ? '#6ee7b7'
                        : d.day < currentDay
                          ? '#fbbf24'
                          : '#e5e7eb',
                  border: d.day === currentDay ? '2px solid #065f46' : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Yesterday recap */}
      {yesterdayPlan && (
        <Card padding="sm" className="border-l-4 border-l-emerald-400">
          <p className="text-xs font-semibold text-[var(--text-secondary,#6b7280)] uppercase mb-1">
            Yesterday's Recap
          </p>
          {yesterdayPlan.completed ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              Completed! You covered {yesterdayPlan.cardCount} cards across{' '}
              {yesterdayPlan.activities.length} activities.
            </p>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Missed yesterday's session. Today's plan will help you catch up.
            </p>
          )}
        </Card>
      )}

      {/* Today's tasks */}
      <Card>
        <h3 className="font-semibold text-[var(--text-primary,#111827)] mb-3">
          Today's Study Tasks
        </h3>
        <div className="space-y-2">
          {todayPlan.activities.map((activity, idx) => {
            const activityColors = {
              learn: '#6366f1',
              review: '#10b981',
              quiz: '#f59e0b',
              game: '#ec4899',
              finalReview: '#8b5cf6',
            };
            const color = activityColors[activity.type] || '#6366f1';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onStartTask({ ...activity, dayNumber: currentDay })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border,#e5e7eb)] hover:shadow-sm transition-all text-left group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {activity.type === 'learn' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                  )}
                  {activity.type === 'review' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                    </svg>
                  )}
                  {activity.type === 'quiz' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                    </svg>
                  )}
                  {activity.type === 'game' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
                    </svg>
                  )}
                  {activity.type === 'finalReview' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[var(--text-primary,#111827)]">
                    {activity.description}
                  </p>
                  <p className="text-xs text-[var(--text-secondary,#6b7280)] capitalize">
                    {activity.type === 'finalReview' ? 'Final Review' : activity.type}
                  </p>
                </div>

                <svg
                  className="w-5 h-5 text-[var(--text-secondary,#6b7280)] group-hover:text-emerald-500 transition-colors shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Encouraging message */}
      <Card padding="sm" className="text-center bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium italic">
          {encouragement}
        </p>
      </Card>

      {/* Start button */}
      <Button
        className="w-full bg-emerald-500 hover:bg-emerald-600"
        size="lg"
        onClick={() => onStartTask(todayPlan.activities[0] ? { ...todayPlan.activities[0], dayNumber: currentDay } : null)}
      >
        Let's Go!
      </Button>
    </div>
  );
}
