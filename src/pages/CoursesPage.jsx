import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLMS } from '../contexts/LMSContext';
import { usePlatform } from '../contexts/PlatformContext';
import { buildDueLabel, formatDateOnly, formatDateTime } from '../lib/dateUtils';

function EmptyCourses({ onConnect, canConnectLive }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-sm text-center">
      <p className="text-5xl mb-4">🎒</p>
      <h2 className="text-2xl font-bold text-gray-800">Connect your classes</h2>
      <p className="text-gray-500 max-w-2xl mx-auto mt-2">
        Pull Canvas coursework into MuteLearn so courses, assignments, grades, and study packs
        can drive the adaptive planner. Demo data is still available if you are not ready to
        use a live connector yet.
      </p>
      <button
        onClick={onConnect}
        className="mt-6 px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
      >
        {canConnectLive ? 'Connect Canvas' : 'Use Canvas Demo'}
      </button>
    </div>
  );
}

function CourseCard({ course, assignments, files, studyPacks, onOpenCourse, onOpenPack }) {
  const nextDeadline = assignments[0] || null;
  const hasGrade = typeof course.currentGrade === 'number';
  const gradeTone =
    !hasGrade
      ? 'text-gray-600 bg-gray-100'
      : course.currentGrade >= 90
      ? 'text-emerald-700 bg-emerald-50'
      : course.currentGrade >= 80
      ? 'text-blue-700 bg-blue-50'
      : 'text-amber-700 bg-amber-50';

  return (
    <article className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-2" style={{ backgroundColor: course.color }} />
      <div className="p-6 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
              {course.code}
            </p>
            <h2 className="text-2xl font-bold text-gray-800">{course.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{course.instructor}</p>
          </div>
          <span className={`px-3 py-2 rounded-xl text-sm font-semibold ${gradeTone}`}>
            {hasGrade ? `Current grade: ${course.currentGrade}%` : 'Grade unavailable'}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
              Next deadline
            </p>
            {nextDeadline ? (
              <>
                <p className="mt-2 font-semibold text-gray-800">{nextDeadline.title}</p>
                <p className="text-sm text-gray-500">{buildDueLabel(nextDeadline.dueAt)}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No upcoming tasks</p>
            )}
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
              Open work
            </p>
            <p className="mt-2 font-semibold text-gray-800">{assignments.length} items</p>
            <p className="text-sm text-gray-500">Assignments, quizzes, and exams</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
              Study packs
            </p>
            <p className="mt-2 font-semibold text-gray-800">{studyPacks.length} packs</p>
            <p className="text-sm text-gray-500">Adaptive prep bundles ready to open</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Upcoming work</h3>
            <div className="space-y-3">
              {assignments.length > 0 ? (
                assignments.slice(0, 4).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{assignment.title}</p>
                      <p className="text-sm text-gray-500">
                        {assignment.type} · {formatDateTime(assignment.dueAt)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-indigo-600 border border-indigo-100">
                      {buildDueLabel(assignment.dueAt)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No active work in this course.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Lecture materials</h3>
            <div className="space-y-3">
              {files.length > 0 ? (
                files.map((file) => (
                  <div key={file.id} className="rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="font-medium text-gray-800">{file.title}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {file.kind} · Synced {formatDateOnly(file.importedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No synced files yet.</p>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onOpenCourse(course.id)}
            className="px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Open Course
          </button>
          {studyPacks[0] && (
            <button
              onClick={() => onOpenPack(studyPacks[0].id)}
              className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
            >
              Open Latest Pack
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function CoursesPage() {
  const navigate = useNavigate();
  const {
    courses,
    assignments,
    files,
    studyPacks,
    isCanvasConnected,
    isSyncing,
    syncSource,
    syncError,
    activeSyncJobId,
    connectCanvasDemo,
    syncCanvas,
    disconnectConnector,
    syncHistory,
  } = useLMS();
  const { backendStatus, session, syncJobs, canvasConfig, requestCanvasAuthLink } = usePlatform();

  const canConnectLive = Boolean(canvasConfig?.oauthConfigured && session);

  const handleCanvasConnect = async () => {
    if (canConnectLive) {
      const payload = await requestCanvasAuthLink();
      if (payload?.authorizationUrl) {
        window.open(payload.authorizationUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    await connectCanvasDemo();
  };

  const courseData = useMemo(
    () =>
      courses.map((course) => ({
        course,
        assignments: assignments.filter((assignment) => assignment.courseId === course.id),
        files: files.filter((file) => file.courseId === course.id),
        studyPacks: studyPacks.filter((pack) => pack.courseId === course.id),
      })),
    [assignments, courses, files, studyPacks]
  );

  const latestJob = syncJobs[0] || null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Courses</h1>
          <p className="text-gray-500 mt-1">
            Bring your LMS workflow into MuteLearn and turn class data into adaptive study
            support.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isCanvasConnected ? (
            <>
              <button
                onClick={syncCanvas}
                className="px-5 py-3 rounded-xl font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
              >
                Sync Canvas
              </button>
              <button
                onClick={() => disconnectConnector('canvas')}
                className="px-5 py-3 rounded-xl font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleCanvasConnect}
              className="px-5 py-3 rounded-xl font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
            >
              {canConnectLive ? 'Connect Canvas' : 'Use Canvas Demo'}
            </button>
          )}
        </div>
      </div>

      {isCanvasConnected && syncHistory[0] && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm text-indigo-700">
            Last sync: {formatDateTime(syncHistory[0].completedAt)} via {syncHistory[0].label}
            {' · '}
            Source: {syncSource}
            {' · '}
            API: {backendStatus}
            {session && ` · Session: ${session.user.name}`}
            {isSyncing && ' · syncing...'}
            {activeSyncJobId && ` · Job: ${activeSyncJobId.slice(0, 12)}`}
            {latestJob && ` · Latest job: ${latestJob.status}`}
          </div>
          {syncError && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-700">
              Sync warning: {syncError}
            </div>
          )}
        </div>
      )}

      {courseData.length === 0 ? (
        <EmptyCourses onConnect={handleCanvasConnect} canConnectLive={canConnectLive} />
      ) : (
        <div className="space-y-6">
          {courseData.map(({ course, assignments: courseAssignments, files: courseFiles, studyPacks: courseStudyPacks }) => (
            <CourseCard
              key={course.id}
              course={course}
              assignments={courseAssignments}
              files={courseFiles}
              studyPacks={courseStudyPacks}
              onOpenCourse={(selectedCourseId) => navigate(`/courses/${selectedCourseId}`)}
              onOpenPack={(packId) => navigate(`/study-packs/${packId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
