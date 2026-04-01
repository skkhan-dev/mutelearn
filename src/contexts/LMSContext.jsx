import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMode } from './ModeContext';
import { useUser } from './UserContext';
import { usePlatform } from './PlatformContext';
import { buildCanvasDemoState } from '../data/lmsDemoData';
import { buildDueLabel, daysUntil, isOverdue, sortByDate } from '../lib/dateUtils';
import { apiClient } from '../lib/apiClient';

const LMSContext = createContext();

const INITIAL_STATE = {
  connectors: {
    canvas: {
      id: 'canvas',
      name: 'Canvas',
      status: 'disconnected',
      connectionMode: 'demo',
      capabilities: ['courses', 'assignments', 'files', 'grades', 'assessment review'],
      lastSyncedAt: null,
    },
  },
  courses: [],
  assignments: [],
  files: [],
  studyPacks: [],
  syncHistory: [],
};

function getModeChunkLabel(mode, focusMinutes) {
  if (mode === 'adhd') return `${Math.min(focusMinutes, 12)} min sprint`;
  if (mode === 'add') return `${focusMinutes} min guided block`;
  if (mode === 'dyslexia') return `${Math.min(focusMinutes, 20)} min read + review block`;
  return `${focusMinutes} min focus block`;
}

export function LMSProvider({ children }) {
  const { user } = useUser();
  const { mode, modeConfig } = useMode();
  const { isBackendOnline, sessionToken, refreshConnectors, refreshJobs } = usePlatform();
  const [lmsState, setLmsState] = useLocalStorage('mutelearn-lms-state', INITIAL_STATE);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSource, setSyncSource] = useState('local');
  const [syncError, setSyncError] = useState('');
  const [activeSyncJobId, setActiveSyncJobId] = useState('');

  const hydrateCanvasState = useCallback(async () => {
    if (!isBackendOnline || !sessionToken) {
      return null;
    }

    const payload = await apiClient.getCanvasState(sessionToken);
    if (payload?.lmsState) {
      setLmsState(payload.lmsState);
      setSyncSource(payload.latestJob?.source || 'server-state');
    }

    return payload?.lmsState || null;
  }, [isBackendOnline, sessionToken, setLmsState]);

  const pollCanvasSyncJob = useCallback(
    async (jobId) => {
      if (!jobId || !sessionToken) {
        return null;
      }

      for (let attempt = 0; attempt < 20; attempt += 1) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 900);
        });
        const jobs = await apiClient.getJobs(sessionToken, 'canvas');
        const job = (jobs.jobs || []).find((item) => item.id === jobId);

        if (!job) {
          continue;
        }

        if (job.status === 'completed') {
          await hydrateCanvasState();
          await refreshConnectors();
          await refreshJobs();
          return job;
        }

        if (job.status === 'failed') {
          setSyncError(job.error || 'Canvas sync failed.');
          await refreshJobs();
          return job;
        }
      }

      setSyncError('Canvas sync is still running in the background. Check Recent Sync Activity.');
      await refreshJobs();
      return null;
    },
    [hydrateCanvasState, refreshConnectors, refreshJobs, sessionToken]
  );

  const syncCanvas = useCallback(({ forceDemo = false } = {}) => {
    return (async () => {
      setIsSyncing(true);
      setSyncError('');
      setActiveSyncJobId('');

      try {
        if (isBackendOnline) {
          if (forceDemo) {
            const payload = await apiClient.syncCanvasDemo({
              sessionToken: sessionToken || undefined,
              body: { user, mode, modeConfig, previousState: lmsState },
            });
            setLmsState(payload.lmsState);
            setSyncSource(payload.source || 'server-demo');
            await refreshConnectors();
            await refreshJobs();
            return payload;
          }

          if (!sessionToken) {
            const payload = await apiClient.syncCanvas({
              sessionToken: undefined,
              body: { user, mode, modeConfig, previousState: lmsState },
            });
            setLmsState(payload.lmsState);
            setSyncSource(payload.source || 'server-demo');
            await refreshConnectors();
            await refreshJobs();
            return payload;
          }

          const queuePayload = await apiClient.queueCanvasSync({
            sessionToken: sessionToken || undefined,
            body: { user, mode, modeConfig, previousState: lmsState },
          });
          const queuedJobId = queuePayload.job?.id || '';
          setActiveSyncJobId(queuedJobId);
          setSyncSource(queuePayload.job?.source || 'background-queued');
          await refreshJobs();
          const completedJob = await pollCanvasSyncJob(queuedJobId);
          return completedJob;
        }

        setLmsState((previousState) =>
          buildCanvasDemoState({ user, mode, modeConfig, previousState })
        );
        setSyncSource('local-fallback');
        return null;
      } catch (error) {
        setSyncError('');

        setLmsState((previousState) =>
          buildCanvasDemoState({ user, mode, modeConfig, previousState })
        );
        setSyncSource('local-fallback');
        return null;
      } finally {
        setIsSyncing(false);
        setActiveSyncJobId('');
      }
    })();
  }, [
    isBackendOnline,
    lmsState,
    mode,
    modeConfig,
    pollCanvasSyncJob,
    refreshConnectors,
    refreshJobs,
    sessionToken,
    setLmsState,
    user,
  ]);

  const connectCanvasDemo = useCallback(() => syncCanvas({ forceDemo: true }), [syncCanvas]);

  const syncCanvasDemo = useCallback(() => syncCanvas(), [syncCanvas]);

  const disconnectConnector = useCallback(
    (connectorId) => {
      return (async () => {
        if (connectorId === 'canvas' && isBackendOnline) {
          try {
            await apiClient.disconnectCanvas(sessionToken || undefined);
            await refreshConnectors();
            await refreshJobs();
            setSyncSource('local');
            setSyncError('');
          } catch (error) {
            setSyncError(error.message);
          }
        }

        setLmsState((previousState) => ({
          ...previousState,
          connectors: {
            ...previousState.connectors,
            [connectorId]: {
              ...previousState.connectors[connectorId],
              status: 'disconnected',
              lastSyncedAt: null,
            },
          },
          courses: previousState.courses.filter((course) => course.connectorId !== connectorId),
          assignments: previousState.assignments.filter(
            (assignment) => assignment.connectorId !== connectorId
          ),
          files: previousState.files.filter((file) => file.connectorId !== connectorId),
          studyPacks: previousState.studyPacks.filter((pack) => {
            const course = previousState.courses.find((item) => item.id === pack.courseId);
            return course?.connectorId !== connectorId;
          }),
        }));
      })();
    },
    [isBackendOnline, refreshConnectors, refreshJobs, sessionToken, setLmsState]
  );

  const updateAssignmentStatus = useCallback(
    (assignmentId, status) => {
      setLmsState((previousState) => ({
        ...previousState,
        assignments: previousState.assignments.map((assignment) =>
          assignment.id === assignmentId ? { ...assignment, status } : assignment
        ),
      }));
    },
    [setLmsState]
  );

  const linkStudyPackDeck = useCallback(
    (packId, deckId) => {
      setLmsState((previousState) => ({
        ...previousState,
        studyPacks: previousState.studyPacks.map((pack) =>
          pack.id === packId ? { ...pack, linkedDeckId: deckId } : pack
        ),
      }));
    },
    [setLmsState]
  );

  const toggleStudyPackChecklistItem = useCallback(
    (packId, itemLabel) => {
      setLmsState((previousState) => ({
        ...previousState,
        studyPacks: previousState.studyPacks.map((pack) => {
          if (pack.id !== packId) {
            return pack;
          }

          const completedChecklist = pack.completedChecklist || [];
          const isCompleted = completedChecklist.includes(itemLabel);

          return {
            ...pack,
            completedChecklist: isCompleted
              ? completedChecklist.filter((item) => item !== itemLabel)
              : [...completedChecklist, itemLabel],
          };
        }),
      }));
    },
    [setLmsState]
  );

  const updateStudyPackReflection = useCallback(
    (packId, focusReflection) => {
      setLmsState((previousState) => ({
        ...previousState,
        studyPacks: previousState.studyPacks.map((pack) =>
          pack.id === packId ? { ...pack, focusReflection } : pack
        ),
      }));
    },
    [setLmsState]
  );

  const connectors = useMemo(
    () => Object.values(lmsState.connectors || {}),
    [lmsState.connectors]
  );

  const courses = useMemo(() => [...lmsState.courses], [lmsState.courses]);
  const courseMap = useMemo(
    () => new Map(courses.map((course) => [course.id, course])),
    [courses]
  );

  const assignments = useMemo(
    () =>
      sortByDate(lmsState.assignments).map((assignment) => ({
        ...assignment,
        course: courseMap.get(assignment.courseId) || null,
      })),
    [courseMap, lmsState.assignments]
  );

  const files = useMemo(
    () =>
      lmsState.files.map((file) => ({
        ...file,
        course: courseMap.get(file.courseId) || null,
      })),
    [courseMap, lmsState.files]
  );

  const assignmentMap = useMemo(
    () => new Map(assignments.map((assignment) => [assignment.id, assignment])),
    [assignments]
  );

  const filesByCourseId = useMemo(() => {
    const groupedFiles = new Map();

    for (const file of files) {
      const existingFiles = groupedFiles.get(file.courseId) || [];
      groupedFiles.set(file.courseId, [...existingFiles, file]);
    }

    return groupedFiles;
  }, [files]);

  const studyPacks = useMemo(
    () =>
      sortByDate(lmsState.studyPacks).map((pack) => {
        const checklist = pack.checklist || [];
        const completedChecklist = (pack.completedChecklist || []).filter((item) =>
          checklist.includes(item)
        );

        return {
          ...pack,
          course: courseMap.get(pack.courseId) || null,
          assignment: assignmentMap.get(pack.sourceId) || null,
          relatedFiles: filesByCourseId.get(pack.courseId) || [],
          checklistItems: checklist.map((item, index) => ({
            id: `${pack.id}-checklist-${index}`,
            label: item,
            completed: completedChecklist.includes(item),
          })),
          completedCount: completedChecklist.length,
          totalChecklistItems: checklist.length,
          progressPercent:
            checklist.length > 0
              ? Math.round((completedChecklist.length / checklist.length) * 100)
              : 0,
        };
      }),
    [assignmentMap, courseMap, filesByCourseId, lmsState.studyPacks]
  );

  const studyPackMap = useMemo(
    () => new Map(studyPacks.map((pack) => [pack.id, pack])),
    [studyPacks]
  );

  const studyPackByAssignmentId = useMemo(
    () =>
      new Map(
        studyPacks
          .filter((pack) => pack.sourceId)
          .map((pack) => [pack.sourceId, pack])
      ),
    [studyPacks]
  );

  const openAssignments = useMemo(
    () =>
      assignments.filter((assignment) =>
        ['pending', 'in_progress'].includes(assignment.status)
      ),
    [assignments]
  );

  const overdueAssignments = useMemo(
    () => openAssignments.filter((assignment) => isOverdue(assignment.dueAt)),
    [openAssignments]
  );

  const upcomingAssignments = useMemo(
    () => openAssignments.filter((assignment) => !isOverdue(assignment.dueAt)).slice(0, 8),
    [openAssignments]
  );

  const upcomingExams = useMemo(
    () =>
      openAssignments.filter((assignment) =>
        ['quiz', 'exam'].includes(assignment.type)
      ),
    [openAssignments]
  );

  const weakAreas = useMemo(() => {
    const lowScoreTopics = assignments
      .filter((assignment) => assignment.scoreHint && assignment.scoreHint < 75)
      .map((assignment) => assignment.topic);

    return [...new Set(lowScoreTopics)].filter(Boolean);
  }, [assignments]);

  const todayPlan = useMemo(() => {
    const focusMinutes = modeConfig?.timer?.focus || 25;

    return openAssignments
      .slice(0, 5)
      .map((assignment) => {
        const recommendedMinutes =
          mode === 'adhd'
            ? Math.min(focusMinutes, 12)
            : mode === 'dyslexia'
            ? Math.min(focusMinutes, 20)
            : focusMinutes;
        const totalBlocks = Math.max(
          1,
          Math.ceil((assignment.estimatedMinutes || focusMinutes) / recommendedMinutes)
        );

        return {
          id: `plan-${assignment.id}`,
          assignmentId: assignment.id,
          studyPackId: studyPackByAssignmentId.get(assignment.id)?.id || '',
          title: assignment.title,
          courseName: assignment.course?.name || 'Course',
          dueAt: assignment.dueAt,
          dueLabel: buildDueLabel(assignment.dueAt),
          chunkLabel: getModeChunkLabel(mode, recommendedMinutes),
          totalBlocks,
          reviewAvailable: assignment.reviewAvailable,
          priorityScore:
            (assignment.type === 'exam' ? 40 : assignment.type === 'quiz' ? 30 : 20) -
            daysUntil(assignment.dueAt),
        };
      })
      .sort((left, right) => right.priorityScore - left.priorityScore);
  }, [mode, modeConfig, openAssignments, studyPackByAssignmentId]);

  const getStudyPackById = useCallback(
    (packId) => studyPackMap.get(packId) || null,
    [studyPackMap]
  );

  const dashboardInsights = useMemo(() => {
    const nextStep = todayPlan[0] || null;
    const focusMinutes = modeConfig?.timer?.focus || 25;
    const nextExam = upcomingExams[0] || null;
    const nextExamPack = nextExam ? studyPackByAssignmentId.get(nextExam.id) || null : null;
    const recoveryQueue = overdueAssignments.slice(0, 3).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      courseId: assignment.course?.id || assignment.courseId || '',
      courseName: assignment.course?.name || 'Course',
      dueAt: assignment.dueAt,
      dueLabel: buildDueLabel(assignment.dueAt),
      studyPackId: studyPackByAssignmentId.get(assignment.id)?.id || '',
    }));
    const quickWins = openAssignments
      .filter((assignment) => (assignment.estimatedMinutes || focusMinutes) <= focusMinutes)
      .slice(0, 3)
      .map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        courseId: assignment.course?.id || assignment.courseId || '',
        courseName: assignment.course?.name || 'Course',
        dueAt: assignment.dueAt,
        dueLabel: buildDueLabel(assignment.dueAt),
        studyPackId: studyPackByAssignmentId.get(assignment.id)?.id || '',
      }));

    return {
      nextStep: nextStep
        ? {
            ...nextStep,
            courseId: nextStep.course?.id || nextStep.courseId || '',
            reason:
              overdueAssignments.length > 0 && overdueAssignments.some((item) => item.id === nextStep.assignmentId)
                ? 'This is overdue, so finishing it first will lower your stress fastest.'
                : nextStep.reviewAvailable
                ? 'Review is available here, so this is a strong place to rebuild confidence.'
                : 'This is the clearest next move based on your workload and mode settings.',
          }
        : null,
      nextExam: nextExam
        ? {
            id: nextExam.id,
            title: nextExam.title,
            courseId: nextExam.course?.id || nextExam.courseId || '',
            courseName: nextExam.course?.name || 'Course',
            dueAt: nextExam.dueAt,
            dueLabel: buildDueLabel(nextExam.dueAt),
            studyPackId: nextExamPack?.id || '',
            reviewAvailable: nextExam.reviewAvailable,
          }
        : null,
      recoveryQueue,
      quickWins,
    };
  }, [
    modeConfig,
    openAssignments,
    overdueAssignments,
    studyPackByAssignmentId,
    todayPlan,
    upcomingExams,
  ]);

  const dashboardSummary = useMemo(
    () => ({
      connectedCourses: courses.length,
      assignmentsDueSoon: upcomingAssignments.length,
      overdueAssignments: overdueAssignments.length,
      readyStudyPacks: studyPacks.length,
      nextExam: upcomingExams[0] || null,
    }),
    [courses.length, overdueAssignments.length, studyPacks.length, upcomingAssignments.length, upcomingExams]
  );

  const isCanvasConnected = lmsState.connectors.canvas?.status === 'connected';

  return (
    <LMSContext.Provider
      value={{
        connectors,
        courses,
        assignments,
        files,
        studyPacks,
        syncHistory: lmsState.syncHistory,
        isCanvasConnected,
        upcomingAssignments,
        overdueAssignments,
        upcomingExams,
        weakAreas,
        todayPlan,
        dashboardSummary,
        dashboardInsights,
        isSyncing,
        syncSource,
        syncError,
        activeSyncJobId,
        syncCanvas,
        connectCanvasDemo,
        syncCanvasDemo,
        disconnectConnector,
        updateAssignmentStatus,
        linkStudyPackDeck,
        toggleStudyPackChecklistItem,
        updateStudyPackReflection,
        getStudyPackById,
      }}
    >
      {children}
    </LMSContext.Provider>
  );
}

export function useLMS() {
  const context = useContext(LMSContext);
  if (!context) {
    throw new Error('useLMS must be used within LMSProvider');
  }
  return context;
}
