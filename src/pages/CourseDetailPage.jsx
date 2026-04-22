import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLMS } from '../contexts/LMSContext';
import { useProfessor } from '../contexts/ProfessorContext';
import { useAssignmentStatus } from '../hooks/useAssignmentStatus';
import { buildDueLabel, formatDateOnly, formatDateTime, isOverdue } from '../lib/dateUtils';

function StatTile({ label, value, detail, tone = 'indigo' }) {
  const toneClasses = {
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
      <p className={`inline-flex mt-3 px-2.5 py-1 rounded-full text-xs font-semibold ${toneClasses[tone]}`}>
        {detail}
      </p>
    </div>
  );
}

function buildGradeTone(grade) {
  if (typeof grade !== 'number') {
    return 'bg-slate-100 text-slate-700';
  }

  if (grade >= 90) {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (grade >= 80) {
    return 'bg-blue-50 text-blue-700';
  }

  return 'bg-amber-50 text-amber-700';
}

function buildStatusTone(status) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'submitted') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'late') return 'bg-orange-50 text-orange-700 border-orange-200';
  if (status === 'overdue') return 'bg-amber-50 text-amber-800 border-amber-200';
  if (status === 'in_progress') return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export default function CourseDetailPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { openProfessor } = useProfessor();
  const {
    isCanvasConnected,
    connectCanvasDemo,
    courses,
    assignments,
    files,
    studyPacks,
    updateAssignmentStatus,
    toggleAssignmentStudyMark,
  } = useLMS();
  const { markStatus: handleMarkStatus, completedToast } = useAssignmentStatus();
  const handleComplete = (assignment) => handleMarkStatus(assignment, 'completed');

  const course = useMemo(
    () => courses.find((item) => item.id === courseId) || null,
    [courseId, courses]
  );

  // Newest (latest due date) first — reverse the ascending sort applied in
  // LMSContext so current and upcoming work sits on top and historical
  // assignments settle at the bottom.
  const courseAssignments = useMemo(
    () =>
      assignments
        .filter((assignment) => assignment.courseId === courseId)
        .slice()
        .sort((a, b) => new Date(b.dueAt) - new Date(a.dueAt)),
    [assignments, courseId]
  );

  const courseFiles = useMemo(
    () => files.filter((file) => file.courseId === courseId),
    [courseId, files]
  );

  const courseStudyPacks = useMemo(
    () => studyPacks.filter((pack) => pack.courseId === courseId),
    [courseId, studyPacks]
  );

  const packByAssignmentId = useMemo(
    () => new Map(courseStudyPacks.map((pack) => [pack.sourceId, pack])),
    [courseStudyPacks]
  );

  const nextExam = useMemo(
    () =>
      courseAssignments.find((assignment) => ['quiz', 'exam'].includes(assignment.type)) || null,
    [courseAssignments]
  );

  // Open = anything that still needs attention. Includes the new manual
  // "overdue" flag but excludes completed/submitted/late (those are done).
  const openAssignments = useMemo(
    () =>
      courseAssignments.filter((assignment) =>
        ['pending', 'in_progress', 'overdue'].includes(assignment.status)
      ),
    [courseAssignments]
  );

  const weakTopics = useMemo(() => {
    const topics = courseAssignments
      .filter((assignment) => assignment.scoreHint && assignment.scoreHint < 75)
      .map((assignment) => assignment.topic);

    return [...new Set(topics)].filter(Boolean);
  }, [courseAssignments]);

  const doneAssignments = useMemo(
    () => courseAssignments.filter((a) => ['completed', 'submitted', 'late'].includes(a.status)),
    [courseAssignments]
  );

  // Date-based overdue OR manual overdue flag — either way, the assignment
  // still needs attention.
  const overdueAssignments = useMemo(
    () =>
      openAssignments.filter(
        (assignment) => assignment.status === 'overdue' || isOverdue(assignment.dueAt)
      ),
    [openAssignments]
  );

  if (!isCanvasConnected) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-sm text-center">
          <p className="text-5xl mb-4">🎒</p>
          <h1 className="text-3xl font-bold text-gray-800">Course Workspace</h1>
          <p className="text-gray-500 max-w-2xl mx-auto mt-2">
            Connect course data first, and MuteLearn will build course workspaces with
            assignments, weak areas, and study packs.
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

  if (!course) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-sm text-center space-y-4">
          <p className="text-5xl">🧭</p>
          <h1 className="text-3xl font-bold text-gray-800">Course not found</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            This course may have been removed during the latest sync. Head back to your course
            list and open one of the currently synced classes.
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="px-5 py-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const gradeTone = buildGradeTone(course.currentGrade);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => navigate('/courses')}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span>←</span>
        <span>Back to Courses</span>
      </button>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-2" style={{ backgroundColor: course.color || '#6366f1' }} />

        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wide">
                  {course.code}
                </span>
                {course.focusTopic && (
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                    Focus topic: {course.focusTopic}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-800">{course.name}</h1>
                <p className="text-gray-500 mt-2 max-w-3xl">
                  A calmer course workspace built from synced LMS assignments, files, grades,
                  and review signals.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                <span>{course.instructor}</span>
                <span>•</span>
                <span>{courseAssignments.length} assignments synced</span>
                <span>•</span>
                <span>{courseFiles.length} files ready</span>
              </div>
            </div>

            <div className={`px-4 py-3 rounded-2xl text-sm font-semibold ${gradeTone}`}>
              {typeof course.currentGrade === 'number'
                ? `Current grade: ${course.currentGrade}%`
                : 'Grade unavailable'}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                openProfessor({
                  subject: course.id,
                  prompt: `Help me prioritize ${course.name}. What should I focus on first this week, and what can wait?`,
                })
              }
              className="px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Ask Professor About This Course
            </button>
            {weakTopics.length > 0 && (
              <button
                onClick={() =>
                  openProfessor({
                    subject: course.id,
                    prompt: `I keep struggling with ${weakTopics.join(', ')} in ${course.name}. Explain the core idea simply and quiz me once after.`,
                  })
                }
                className="px-4 py-2 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
              >
                Review Weak Topics
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Open work"
              value={openAssignments.length}
              detail={`${overdueAssignments.length} overdue items need attention`}
              tone={overdueAssignments.length > 0 ? 'amber' : 'indigo'}
            />
            <StatTile
              label="Study packs"
              value={courseStudyPacks.length}
              detail="Ready from synced coursework"
              tone="emerald"
            />
            <StatTile
              label="Weak topics"
              value={weakTopics.length}
              detail={weakTopics.length > 0 ? weakTopics.join(', ') : 'No flagged weak areas yet'}
              tone={weakTopics.length > 0 ? 'amber' : 'slate'}
            />
            <StatTile
              label="Next exam"
              value={nextExam ? buildDueLabel(nextExam.dueAt) : 'None'}
              detail={nextExam ? nextExam.title : 'No quiz or exam scheduled'}
              tone={nextExam ? 'indigo' : 'slate'}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-3xl border border-gray-100 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Course work queue</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Open assignments, quizzes, and exams with quick actions.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/planner')}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Open Planner
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {courseAssignments.length > 0 ? (
                  courseAssignments.map((assignment) => {
                    const pack = packByAssignmentId.get(assignment.id);
                    const statusTone = buildStatusTone(assignment.status);

                    return (
                      <div
                        key={assignment.id}
                        className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 space-y-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex items-start gap-3 min-w-0">
                            {assignment.status !== 'completed' && (
                              <input
                                type="checkbox"
                                checked={!!assignment.markedForStudy}
                                onChange={() => toggleAssignmentStudyMark(assignment.id)}
                                title={
                                  assignment.markedForStudy
                                    ? 'Remove from Study Session'
                                    : 'Mark for Study — appears in Study Session tab'
                                }
                                className="mt-1 h-5 w-5 rounded border-2 border-amber-400 text-amber-600 accent-amber-600 focus:ring-amber-400 cursor-pointer flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-gray-800">{assignment.title}</p>
                                <span className="px-2.5 py-1 rounded-full bg-white text-gray-500 text-xs font-semibold capitalize border border-gray-200">
                                  {assignment.type}
                                </span>
                                {assignment.reviewAvailable && (
                                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">
                                    Review available
                                  </span>
                                )}
                                {assignment.markedForStudy && (
                                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
                                    Studying
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-2">
                                {formatDateTime(assignment.dueAt)} ·{' '}
                                {buildDueLabel(assignment.dueAt, { status: assignment.status })}
                              </p>
                              <p className="text-sm text-gray-600 mt-2">
                                {assignment.description || 'No assignment summary was provided by the LMS.'}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-2 rounded-xl text-sm font-semibold border ${statusTone}`}>
                            {assignment.status.replace('_', ' ')}
                          </span>
                        </div>

                        {!['completed', 'submitted', 'late'].includes(assignment.status) && (
                          <div className="flex flex-wrap gap-3">
                            {pack && (
                              <button
                                onClick={() => navigate(`/study-packs/${pack.id}`)}
                                className="px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-white transition-colors"
                              >
                                Open Pack
                              </button>
                            )}
                            {assignment.status === 'pending' && (
                              <button
                                onClick={() => updateAssignmentStatus(assignment.id, 'in_progress')}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-white transition-colors"
                              >
                                In Progress
                              </button>
                            )}
                            <button
                              onClick={() => handleMarkStatus(assignment, 'overdue')}
                              disabled={assignment.status === 'overdue'}
                              className={`px-4 py-2 rounded-xl border transition-colors ${
                                assignment.status === 'overdue'
                                  ? 'bg-amber-100 border-amber-300 text-amber-800 cursor-default'
                                  : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              }`}
                              title="Mark this assignment as overdue"
                            >
                              Overdue
                            </button>
                            <button
                              onClick={() => handleMarkStatus(assignment, 'late')}
                              className="px-4 py-2 rounded-xl border border-orange-200 text-orange-700 hover:bg-orange-50 transition-colors"
                              title="Turned in late — counts as done but tagged late"
                            >
                              Late
                            </button>
                            <button
                              onClick={() => handleMarkStatus(assignment, 'completed')}
                              className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                            >
                              Completed
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">No assignments have been synced for this course yet.</p>
                )}
              </div>

              {doneAssignments.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-600 mb-3">Done</h3>
                  <div className="space-y-2">
                    {doneAssignments.map((assignment) => {
                      const isLate = assignment.status === 'late';
                      return (
                        <div
                          key={assignment.id}
                          className={`rounded-2xl px-4 py-3 flex items-center gap-3 border ${
                            isLate
                              ? 'bg-orange-50/60 border-orange-100'
                              : 'bg-emerald-50/50 border-emerald-100'
                          }`}
                        >
                          <span className={`text-lg ${isLate ? 'text-orange-500' : 'text-emerald-500'}`}>
                            {isLate ? '⏰' : '\u2713'}
                          </span>
                          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-gray-500 line-through">{assignment.title}</p>
                            {isLate && (
                              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold border border-orange-200">
                                Late
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {assignment.type} ·{' '}
                            {assignment.completedAt ? formatDateOnly(assignment.completedAt) : assignment.status}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-6">
              <div className="rounded-3xl border border-gray-100 p-5">
                <h2 className="text-xl font-bold text-gray-800">Study packs</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Jump into the adaptive prep bundles already created for this course.
                </p>

                <div className="mt-5 space-y-3">
                  {courseStudyPacks.length > 0 ? (
                    courseStudyPacks.map((pack) => (
                      <button
                        key={pack.id}
                        onClick={() => navigate(`/study-packs/${pack.id}`)}
                        className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-left hover:bg-white transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-800">{pack.title}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {pack.completedCount}/{pack.totalChecklistItems} steps complete
                            </p>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-indigo-600 border border-indigo-100">
                            {buildDueLabel(pack.dueAt)}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No study packs are ready for this course yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 p-5">
                <h2 className="text-xl font-bold text-gray-800">Materials and topics</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Synced files and concept clusters to anchor your review.
                </p>

                {course.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {course.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 space-y-3">
                  {courseFiles.length > 0 ? (
                    courseFiles.map((file) => (
                      <div key={file.id} className="rounded-2xl bg-gray-50 px-4 py-3">
                        <p className="font-medium text-gray-800">{file.title}</p>
                        <p className="text-sm text-gray-500 capitalize mt-1">
                          {file.kind} · Synced {formatDateOnly(file.importedAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No files are synced for this course yet.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      {completedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-bounce">
          <span className="text-xl">🎉</span>
          <span className="font-medium">{completedToast.title} done! +{completedToast.xp} XP</span>
        </div>
      )}
    </div>
  );
}
