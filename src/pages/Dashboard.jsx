import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useMode } from '../contexts/ModeContext';
import { useLMS } from '../contexts/LMSContext';
import { useProfessor } from '../contexts/ProfessorContext';
import { useGamification } from '../contexts/GamificationContext';
import { useStudy } from '../contexts/StudyContext';
import { useAssignmentStatus } from '../hooks/useAssignmentStatus';
import { xpPerLevel, levelNames, encouragingMessages } from '../config/modeDefaults';
import { formatDateTime, formatRelativeTime } from '../lib/dateUtils';
import { stablePick } from '../lib/textUtils';

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

function ActivityItem({ activity, referenceTime }) {
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
        <p className="text-xs text-gray-400">
          {formatRelativeTime(activity.date || activity.completedAt, referenceTime)}
        </p>
      </div>
      {activity.xpEarned && (
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full shrink-0">
          +{activity.xpEarned} XP
        </span>
      )}
    </div>
  );
}

function InsightCard({ eyebrow, title, description, tone = 'indigo', children }) {
  const toneClasses = {
    indigo: 'border-indigo-100 bg-indigo-50',
    amber: 'border-amber-100 bg-amber-50',
    emerald: 'border-emerald-100 bg-emerald-50',
    slate: 'border-gray-100 bg-gray-50',
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{eyebrow}</p>
      <h3 className="text-xl font-bold text-gray-800 mt-2">{title}</h3>
      <p className="text-sm text-gray-600 mt-2">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useUser();
  const { modeConfig } = useMode();
  const {
    isCanvasConnected,
    connectCanvasDemo,
    dashboardSummary,
    dashboardInsights,
    todayPlan,
    completedThisWeek,
    assignments,
    dueReminders,
    clearAssignmentReminder,
  } = useLMS();
  const { openProfessor } = useProfessor();
  const { xp, level, streak, stats, sessionHistory } = useGamification();
  const { decks } = useStudy();
  const { markStatus, completedToast } = useAssignmentStatus();

  const [referenceTime] = useState(() => Date.now());

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
  const encouragement = stablePick(
    encouragingMessages,
    `${firstName}-${user.gradeLevel}-${level}-${streak.current}`
  );

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

      {isCanvasConnected ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="🎒"
              label="Synced Courses"
              value={dashboardSummary.connectedCourses}
              color="#10b981"
            />
            <StatCard
              icon="🗓️"
              label="Due Soon"
              value={dashboardSummary.assignmentsDueSoon}
              color="#6366f1"
            />
            <StatCard
              icon="📦"
              label="Study Packs"
              value={dashboardSummary.readyStudyPacks}
              color="#8b5cf6"
            />
            <StatCard
              icon="🎉"
              label="Done This Week"
              value={completedThisWeek.length}
              color="#10b981"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            {dashboardInsights.nextStep ? (
              <InsightCard
                eyebrow="Do This Next"
                title={dashboardInsights.nextStep.title}
                description={dashboardInsights.nextStep.reason}
                tone={dashboardSummary.overdueAssignments > 0 ? 'amber' : 'indigo'}
              >
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span>{dashboardInsights.nextStep.courseName}</span>
                  <span>•</span>
                  <span>{dashboardInsights.nextStep.dueLabel}</span>
                  <span>•</span>
                  <span>{dashboardInsights.nextStep.chunkLabel} x {dashboardInsights.nextStep.totalBlocks}</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  {dashboardInsights.nextStep.studyPackId && (
                    <Link
                      to={`/study-packs/${dashboardInsights.nextStep.studyPackId}`}
                      className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                    >
                      Open Pack
                    </Link>
                  )}
                  <Link
                    to="/planner"
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-white transition-colors"
                  >
                    Open Planner
                  </Link>
                  <button
                    onClick={() =>
                      openProfessor({
                        subject:
                          dashboardInsights.nextStep.courseId ||
                          dashboardInsights.nextStep.courseName,
                        prompt: `I need help starting ${dashboardInsights.nextStep.title}. Give me the smallest first step and how to use the next ${dashboardInsights.nextStep.totalBlocks} study blocks well.`,
                      })
                    }
                    className="px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-white transition-colors"
                  >
                    Ask Professor
                  </button>
                </div>
              </InsightCard>
            ) : (
              <InsightCard
                eyebrow="Do This Next"
                title="Your queue is clear"
                description="You do not have any open school tasks right now. This is a good time for flashcard review or a short confidence-building study session."
                tone="emerald"
              >
                <div className="flex flex-wrap gap-3 mt-4">
                  <Link
                    to="/flashcards"
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                  >
                    Review Flashcards
                  </Link>
                  <Link
                    to="/study"
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-white transition-colors"
                  >
                    Start Study Session
                  </Link>
                </div>
              </InsightCard>
            )}

            {dashboardInsights.nextExam ? (
              <InsightCard
                eyebrow="Exam Countdown"
                title={dashboardInsights.nextExam.title}
                description={`Next assessment in ${dashboardInsights.nextExam.courseName}. ${dashboardInsights.nextExam.reviewAvailable ? 'Review is available, so this is a strong time to revisit missed topics.' : 'Build recall now so the review feels lighter later.'}`}
                tone="amber"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span>{dashboardInsights.nextExam.dueLabel}</span>
                  <span>•</span>
                  <span>{formatDateTime(dashboardInsights.nextExam.dueAt)}</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  {dashboardInsights.nextExam.studyPackId && (
                    <Link
                      to={`/study-packs/${dashboardInsights.nextExam.studyPackId}`}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                    >
                      Open Exam Pack
                    </Link>
                  )}
                  <Link
                    to="/courses"
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-white transition-colors"
                  >
                    Open Courses
                  </Link>
                  <button
                    onClick={() =>
                      openProfessor({
                        subject:
                          dashboardInsights.nextExam.courseId ||
                          dashboardInsights.nextExam.courseName,
                        prompt: `Help me prep for ${dashboardInsights.nextExam.title}. I want a calm plan for what to review first and what to ignore for now.`,
                      })
                    }
                    className="px-4 py-2 rounded-xl border border-amber-200 text-amber-700 hover:bg-white transition-colors"
                  >
                    Ask Professor
                  </button>
                </div>
              </InsightCard>
            ) : (
              <InsightCard
                eyebrow="Exam Countdown"
                title="No exam pressure right now"
                description="There are no upcoming quizzes or exams in your synced queue at the moment, so you can focus on regular assignments and staying ahead."
                tone="slate"
              />
            )}
          </div>

          {dueReminders.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-amber-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">🔔 Reminders due</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    You asked to be reminded about these. Clear when you're done, or mark the assignment.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {dueReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{reminder.title}</p>
                      <p className="text-sm text-gray-500">
                        {reminder.course?.name || 'Course'} · Due {formatDateTime(reminder.dueAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button
                        onClick={() => markStatus(reminder, 'completed')}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm"
                      >
                        ✓ Done
                      </button>
                      <button
                        onClick={() => clearAssignmentReminder(reminder.id)}
                        className="px-4 py-2 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors text-sm"
                      >
                        Clear reminder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Recovery Queue</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    The fastest way to reduce stress if work is starting to stack up.
                  </p>
                </div>
                <Link
                  to="/planner"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Open Planner
                </Link>
              </div>
              <div className="mt-5 space-y-3">
                {dashboardInsights.recoveryQueue.length > 0 ? (
                  dashboardInsights.recoveryQueue.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{item.title}</p>
                        <p className="text-sm text-gray-500">
                          {item.courseName} · {item.dueLabel}
                        </p>
                      </div>
                      {item.studyPackId && (
                        <Link
                          to={`/study-packs/${item.studyPackId}`}
                          className="px-4 py-2 rounded-xl bg-white text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors text-center"
                        >
                          Open Pack
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          const full = assignments.find((a) => a.id === item.id);
                          if (full) markStatus(full, 'completed');
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-center"
                        title="Mark as done"
                      >
                        ✓ Done
                      </button>
                      <button
                        onClick={() =>
                          openProfessor({
                            subject: item.courseId || item.courseName,
                            prompt: `Help me recover ${item.title} without getting overwhelmed. Give me a short catch-up plan I can start right now.`,
                          })
                        }
                        className="px-4 py-2 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors text-center"
                      >
                        Ask Professor
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-4">
                    <p className="font-semibold text-emerald-800">Nothing overdue</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      You are caught up right now. Keep using the planner to stay ahead.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Quick Wins</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Smaller tasks that fit your current focus setting and build momentum fast.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600">
                  {modeConfig.label} mode
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {dashboardInsights.quickWins.length > 0 ? (
                  dashboardInsights.quickWins.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-gray-50 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{item.title}</p>
                        <p className="text-sm text-gray-500">
                          {item.courseName} · {item.dueLabel}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.studyPackId && (
                          <Link
                            to={`/study-packs/${item.studyPackId}`}
                            className="px-3 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-white transition-colors text-sm"
                          >
                            Open Pack
                          </Link>
                        )}
                        <Link
                          to="/study"
                          className="px-3 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors text-sm"
                        >
                          Start Session
                        </Link>
                        <button
                          onClick={() =>
                            openProfessor({
                              subject: item.courseId || item.courseName,
                              prompt: `I have a quick-win task: ${item.title}. Help me finish it in one focused session.`,
                            })
                          }
                          className="px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-white transition-colors text-sm"
                        >
                          Ask Professor
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                    <p className="font-semibold text-gray-800">No quick wins detected yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Your current tasks are a bit larger, so opening the planner or a study pack is the best next move.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-indigo-900">Add your school workflow</h2>
            <p className="text-indigo-700 mt-1 max-w-2xl">
              Connect Canvas-style course data so MuteLearn can build adaptive planners,
              exam countdowns, and class-specific study packs.
            </p>
          </div>
          <button
            onClick={connectCanvasDemo}
            className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors self-start"
          >
            Connect Canvas Demo
          </button>
        </div>
      )}

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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction
            to="/study"
            icon="📖"
            label="Study Session"
            description="Start a focused study session"
            color="#8b5cf6"
          />
          <QuickAction
            to="/planner"
            icon="🗓️"
            label="Planner"
            description="See today&apos;s adaptive task list"
            color="#6366f1"
          />
          <QuickAction
            to="/courses"
            icon="🎒"
            label="Courses"
            description="Open synced classes and materials"
            color="#10b981"
          />
          <QuickAction
            to="/flashcards"
            icon="🃏"
            label="Flashcards"
            description="Review your flashcard decks"
            color="#3b82f6"
          />
          <QuickAction
            to="/quizzes"
            icon="📝"
            label="Take a Quiz"
            description="Test your knowledge"
            color="#10b981"
          />
          <QuickAction
            to="/study-packs"
            icon="📦"
            label="Study Packs"
            description="Turn assignments into prep bundles"
            color="#f59e0b"
          />
        </div>
      </div>

      {isCanvasConnected && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Today&apos;s Adaptive Plan</h2>
              <p className="text-sm text-gray-500 mt-1">
                Built from your synced coursework and {modeConfig.label.toLowerCase()} mode.
              </p>
            </div>
            <Link
              to="/planner"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Open Planner
            </Link>
          </div>
          <div className="space-y-3">
            {todayPlan.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="rounded-2xl bg-gray-50 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-800">{task.title}</p>
                  <p className="text-sm text-gray-500">
                    {task.courseName} · {task.dueLabel}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {task.studyPackId && (
                    <Link
                      to={`/study-packs/${task.studyPackId}`}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-colors"
                    >
                      Open Pack
                    </Link>
                  )}
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-indigo-600 border border-indigo-100">
                    {task.chunkLabel} x {task.totalBlocks}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {recentActivity.map((activity, i) => (
              <ActivityItem
                key={(activity.date || activity.completedAt || i) + i}
                activity={activity}
                referenceTime={referenceTime}
              />
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

      {completedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <span className="text-xl">🎉</span>
          <span className="font-medium">
            {completedToast.title} done! +{completedToast.xp} XP
          </span>
        </div>
      )}
    </div>
  );
}
