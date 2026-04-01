import { useNavigate } from 'react-router-dom';
import { useLMS } from '../contexts/LMSContext';
import { useMode } from '../contexts/ModeContext';
import { buildDueLabel, formatDateTime } from '../lib/dateUtils';

function SummaryCard({ label, value, detail, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-2" style={{ color }}>
        {value}
      </p>
      <p className="text-sm text-gray-400 mt-1">{detail}</p>
    </div>
  );
}

export default function PlannerPage() {
  const navigate = useNavigate();
  const {
    isCanvasConnected,
    connectCanvasDemo,
    todayPlan,
    overdueAssignments,
    upcomingExams,
    studyPacks,
    updateAssignmentStatus,
  } = useLMS();
  const { modeConfig } = useMode();

  if (!isCanvasConnected) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-sm text-center">
          <p className="text-5xl mb-4">🗓️</p>
          <h1 className="text-3xl font-bold text-gray-800">Adaptive Planner</h1>
          <p className="text-gray-500 max-w-2xl mx-auto mt-2">
            Connect course data first, and MuteLearn will turn assignments and exams into
            mode-aware daily study blocks.
          </p>
          <button
            onClick={connectCanvasDemo}
            className="mt-6 px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
          >
            Connect Canvas Demo
          </button>
        </div>
      </div>
    );
  }

  const focusMinutes = modeConfig?.timer?.focus || 25;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Planner</h1>
        <p className="text-gray-500 mt-1">
          Your school workload translated into calmer, mode-aware next steps.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Today blocks"
          value={todayPlan.length}
          detail={`Built around your ${focusMinutes} minute focus setting`}
          color="#6366f1"
        />
        <SummaryCard
          label="Overdue"
          value={overdueAssignments.length}
          detail="Assignments that need quick triage"
          color="#ef4444"
        />
        <SummaryCard
          label="Upcoming exams"
          value={upcomingExams.length}
          detail="Use study packs before these pile up"
          color="#f59e0b"
        />
        <SummaryCard
          label="Study packs"
          value={studyPacks.length}
          detail="Ready from synced coursework"
          color="#10b981"
        />
      </div>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Today&apos;s adaptive plan</h2>
            <p className="text-sm text-gray-500 mt-1">
              Prioritized by urgency, workload, and your current study mode.
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-semibold">
            {modeConfig.label} mode
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {todayPlan.length > 0 ? (
            todayPlan.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-800">{task.title}</p>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-indigo-600 border border-indigo-100">
                      {task.courseName}
                    </span>
                    {task.reviewAvailable && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                        Review available
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {buildDueLabel(task.dueAt)} · {formatDateTime(task.dueAt)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Recommended plan: {task.chunkLabel} x {task.totalBlocks}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {task.studyPackId && (
                    <button
                      onClick={() => navigate(`/study-packs/${task.studyPackId}`)}
                      className="px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-white transition-colors"
                    >
                      Open Pack
                    </button>
                  )}
                  <button
                    onClick={() => updateAssignmentStatus(task.assignmentId, 'in_progress')}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white transition-colors"
                  >
                    Mark In Progress
                  </button>
                  <button
                    onClick={() => updateAssignmentStatus(task.assignmentId, 'submitted')}
                    className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                  >
                    Mark Submitted
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No open work right now. Nice job.</p>
          )}
        </div>
      </section>
    </div>
  );
}
