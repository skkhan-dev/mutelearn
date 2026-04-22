import { slugify } from './textUtils.js';

const COURSE_COLORS = ['#10b981', '#6366f1', '#f97316', '#14b8a6', '#8b5cf6', '#3b82f6', '#ef4444', '#ec4899'];

async function canvasFetch(path, canvasBaseUrl, canvasToken) {
  const res = await fetch(`/api/canvas-proxy/${path}`, {
    headers: {
      'x-canvas-base-url': canvasBaseUrl,
      'x-canvas-token': canvasToken,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Canvas API error (${res.status}): ${text}`);
  }
  return res.json();
}

// Paginated fetch — Canvas caps per_page at 100 and splits larger lists across pages.
// We keep requesting until a page returns fewer items than per_page (or the safety cap trips).
async function canvasFetchAll(basePath, canvasBaseUrl, canvasToken, { perPage = 100, maxPages = 10 } = {}) {
  const results = [];
  const joiner = basePath.includes('?') ? '&' : '?';
  for (let page = 1; page <= maxPages; page += 1) {
    const pagePath = `${basePath}${joiner}per_page=${perPage}&page=${page}`;
    const batch = await canvasFetch(pagePath, canvasBaseUrl, canvasToken);
    if (!Array.isArray(batch) || batch.length === 0) break;
    results.push(...batch);
    if (batch.length < perPage) break;
  }
  return results;
}

function inferAssignmentType(assignment) {
  if (assignment.quiz_id) return 'quiz';
  const name = (assignment.name || '').toLowerCase();
  if (name.includes('exam') || name.includes('final') || name.includes('midterm')) return 'exam';
  if (name.includes('quiz') || name.includes('test')) return 'quiz';
  if (name.includes('reading') || name.includes('read')) return 'reading';
  return 'assignment';
}

function inferStatus(submission) {
  if (!submission) return 'pending';
  if (submission.workflow_state === 'graded') return 'completed';
  if (submission.workflow_state === 'submitted') return 'submitted';
  if (submission.workflow_state === 'pending_review') return 'submitted';
  return 'pending';
}

function inferFileKind(file) {
  const name = (file.display_name || '').toLowerCase();
  const type = (file['content-type'] || '').toLowerCase();
  if (name.includes('slide') || type.includes('presentation') || name.endsWith('.pptx') || name.endsWith('.ppt')) return 'slides';
  if (name.includes('lab') || name.includes('experiment')) return 'lab';
  if (name.includes('worksheet') || name.includes('practice')) return 'worksheet';
  if (name.includes('lecture') || name.includes('video') || type.includes('video')) return 'lecture';
  if (type.includes('pdf') || name.endsWith('.pdf')) return 'reading';
  return 'reading';
}

function getTeacherName(course) {
  if (course.teachers && course.teachers.length > 0) {
    return course.teachers[0].display_name || course.teachers[0].name || 'Instructor';
  }
  return 'Instructor';
}

function getCourseGrade(course) {
  if (course.enrollments) {
    for (const enrollment of course.enrollments) {
      if (enrollment.type === 'student') {
        if (typeof enrollment.computed_current_score === 'number') return enrollment.computed_current_score;
        if (typeof enrollment.computed_final_score === 'number') return enrollment.computed_final_score;
      }
    }
  }
  return null;
}

function extractTopic(assignmentName) {
  // Remove common prefixes/suffixes to get the core topic
  return assignmentName
    .replace(/\b(homework|hw|assignment|quiz|test|exam|lab|project|review|practice|set|checkpoint|final|midterm)\b/gi, '')
    .replace(/[:\-–—#()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || assignmentName;
}

export async function fetchRealCanvasData({ canvasBaseUrl, canvasToken, mode, modeConfig, previousState }) {
  const today = new Date();
  const previousPacks = new Map((previousState?.studyPacks || []).map((pack) => [pack.id, pack]));

  // Only keep assignments that are due within a meaningful window: roughly the
  // current term. We include recently-overdue work (so students can catch up)
  // and everything still upcoming. Anything older than ~45 days in the past is
  // assumed to be from a previous term and ignored.
  const RECENT_WINDOW_MS = 45 * 24 * 60 * 60 * 1000;
  const earliestRelevant = new Date(today.getTime() - RECENT_WINDOW_MS);

  // Fetch courses (paginated)
  const rawCourses = await canvasFetchAll(
    'courses?enrollment_state=active&include[]=teachers&include[]=total_scores&include[]=current_grading_period_scores&include[]=term',
    canvasBaseUrl,
    canvasToken,
    { perPage: 50, maxPages: 4 }
  );

  const courses = rawCourses
    .filter((c) => {
      if (!c.name || c.access_restricted_by_date) return false;
      // Canvas marks finished courses with end_at in the past, or a term that has ended.
      const courseEnd = c.end_at ? new Date(c.end_at) : null;
      if (courseEnd && courseEnd.getTime() < earliestRelevant.getTime()) return false;
      const termEnd = c.term?.end_at ? new Date(c.term.end_at) : null;
      if (termEnd && termEnd.getTime() < earliestRelevant.getTime()) return false;
      return true;
    })
    .map((course, index) => ({
      id: `canvas-course-${course.id}`,
      canvasCourseId: String(course.id),
      connectorId: 'canvas',
      code: course.course_code || `COURSE-${course.id}`,
      name: course.name,
      instructor: getTeacherName(course),
      color: COURSE_COLORS[index % COURSE_COLORS.length],
      currentGrade: getCourseGrade(course),
      topics: [],
      syncedAt: today.toISOString(),
    }));

  // Fetch assignments and files for each course in parallel
  const courseDataPromises = courses.map(async (course) => {
    const [rawAssignments, rawFiles] = await Promise.all([
      canvasFetchAll(
        `courses/${course.canvasCourseId}/assignments?include[]=submission&order_by=due_at`,
        canvasBaseUrl,
        canvasToken,
        { perPage: 100, maxPages: 6 }
      ).catch(() => []),
      canvasFetch(
        `courses/${course.canvasCourseId}/files?sort=updated_at&order=desc&per_page=10`,
        canvasBaseUrl,
        canvasToken
      ).catch(() => []),
    ]);

    const assignments = rawAssignments
      .filter((a) => {
        if (!a.name || !a.due_at) return false;
        // Canvas sometimes returns an overridden per-student due date on the submission.
        // Prefer it when present so we don't show a stale class-level due_at.
        const effectiveDueAt = a.submission?.cached_due_date || a.due_at;
        const dueTime = new Date(effectiveDueAt).getTime();
        if (Number.isNaN(dueTime)) return false;
        // Always keep completed/submitted work so students can look back at
        // past assignments, regardless of how old the due date is.
        const status = inferStatus(a.submission);
        if (status === 'completed' || status === 'submitted') return true;
        // Otherwise keep upcoming assignments plus the recent window.
        return dueTime >= earliestRelevant.getTime();
      })
      .map((a) => {
        // Prefer the student's overridden due date when Canvas provides one.
        const effectiveDueAt = a.submission?.cached_due_date || a.due_at;
        const type = inferAssignmentType(a);
        const score = a.submission?.score != null && a.points_possible
          ? Math.round((a.submission.score / a.points_possible) * 100)
          : null;

        const status = inferStatus(a.submission);
        // For Canvas-reported completions, use the graded-at or submitted-at
        // timestamp so weekly-stats memos that gate on completedAt can count
        // them correctly.
        const completedAt =
          status === 'completed' || status === 'submitted'
            ? a.submission?.graded_at || a.submission?.submitted_at || null
            : null;

        return {
          id: `canvas-assignment-${a.id}`,
          courseId: course.id,
          connectorId: 'canvas',
          canvasAssignmentId: String(a.id),
          title: a.name,
          type,
          topic: extractTopic(a.name),
          dueAt: effectiveDueAt,
          estimatedMinutes: Math.max(15, Math.min(90, Math.round((a.points_possible || 10) * 1.5))),
          status,
          completedAt,
          scoreHint: score,
          reviewAvailable: Boolean(a.quiz_id || (a.submission?.graded_at && score !== null)),
          description: (a.description || '').replace(/<[^>]*>/g, '').slice(0, 200),
        };
      })
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

    // Extract topics from assignment names
    const topics = [...new Set(assignments.map((a) => a.topic).filter(Boolean))].slice(0, 5);
    course.topics = topics;

    const files = (Array.isArray(rawFiles) ? rawFiles : []).map((f) => ({
      id: `canvas-file-${f.id}`,
      courseId: course.id,
      connectorId: 'canvas',
      title: f.display_name || f.filename || 'Untitled',
      kind: inferFileKind(f),
      importedAt: f.updated_at || f.created_at || today.toISOString(),
      url: f.url || '#',
    }));

    return { course, assignments, files };
  });

  const courseData = await Promise.all(courseDataPromises);

  const freshAssignments = courseData.flatMap((d) => d.assignments);
  const allFiles = courseData.flatMap((d) => d.files);

  // Preserve completed Canvas assignments from the prior state so the student
  // can always look back at what they finished — even if the assignment's
  // course is no longer returned by the current sync (archived term, etc.).
  // Also preserve any status the student set locally via completeAssignment(),
  // since Canvas may not yet reflect a just-submitted item.
  const freshAssignmentIds = new Set(freshAssignments.map((a) => a.id));
  const previousAssignments = previousState?.assignments || [];
  const previousById = new Map(previousAssignments.map((a) => [a.id, a]));

  const retainedCompleted = previousAssignments.filter(
    (a) =>
      a.connectorId === 'canvas' &&
      (a.status === 'completed' || a.status === 'submitted') &&
      !freshAssignmentIds.has(a.id)
  );

  // Merge any local-only fields from the previous state onto fresh records
  // so re-syncs don't clobber student-set state (study flags, notes,
  // reminders, in-app completions, manual overdue/late labels).
  const LOCAL_FIELDS = ['markedForStudy', 'studyNotes', 'reminderAt'];
  const LOCAL_STATUSES = ['completed', 'late', 'overdue'];

  const allAssignments = [
    ...freshAssignments.map((a) => {
      const prev = previousById.get(a.id);
      if (!prev) return a;
      const merged = { ...a };

      // Preserve locally-set fields verbatim.
      for (const field of LOCAL_FIELDS) {
        if (prev[field] != null && merged[field] == null) {
          merged[field] = prev[field];
        }
      }

      // Preserve status when the student set one Canvas wouldn't know about
      // (completed in-app, marked overdue, marked late). Canvas-driven
      // statuses (submitted) always win over their unset counterparts.
      if (LOCAL_STATUSES.includes(prev.status) && a.status !== 'completed' && a.status !== 'submitted') {
        merged.status = prev.status;
      }

      // Preserve the earliest completedAt we know about.
      if (prev.completedAt && !merged.completedAt) {
        merged.completedAt = prev.completedAt;
      }

      return merged;
    }),
    ...retainedCompleted,
  ];

  // Build study packs from open assignments (not reading type, with due dates in the future or recently past)
  // Includes manual 'overdue' flag so packs don't disappear when students mark an assignment overdue.
  const openAssignments = allAssignments.filter(
    (a) => ['pending', 'in_progress', 'overdue'].includes(a.status) && a.type !== 'reading'
  );

  const focusMinutes = modeConfig?.timer?.focus || 25;
  const studyPacks = openAssignments.map((assignment) => {
    const course = courses.find((c) => c.id === assignment.courseId);
    const courseSlug = slugify(course?.name || 'course');
    const assignmentSlug = slugify(assignment.title);
    const packId = `pack-${courseSlug}-${assignmentSlug}`;
    const isExam = assignment.type === 'exam' || assignment.type === 'quiz';
    const previousPack = previousPacks.get(packId);

    const checklist = buildChecklist(assignment, course, mode, modeConfig);
    const flashcards = buildFlashcards(assignment, course);

    const pack = {
      id: packId,
      courseId: assignment.courseId,
      sourceId: assignment.id,
      sourceType: assignment.type,
      title: `${assignment.title} Study Pack`,
      summary: `A guided prep pack for ${assignment.title} in ${course?.name || 'your course'}.`,
      dueAt: assignment.dueAt,
      weakTopics: assignment.scoreHint != null && assignment.scoreHint < 75 ? [assignment.topic] : [],
      checklist,
      completedChecklist: previousPack?.completedChecklist || [],
      flashcards,
      recommendedSessionMinutes: Math.min(focusMinutes, isExam ? 30 : assignment.estimatedMinutes),
      linkedDeckId: previousPack?.linkedDeckId || null,
      focusReflection: previousPack?.focusReflection || '',
      reviewAvailable: assignment.reviewAvailable,
      reviewSummary: assignment.reviewAvailable
        ? `Review is available for ${assignment.title}. Focus on missed questions.`
        : 'Review details are not yet available from the LMS.',
    };

    return pack;
  });

  // Keep any prior courses that are referenced by retained historical
  // assignments but are no longer returned by the current sync — otherwise
  // the historical assignments would become orphaned with no course context.
  const freshCourseIds = new Set(courses.map((c) => c.id));
  const referencedCourseIds = new Set(retainedCompleted.map((a) => a.courseId));
  const retainedCourses = (previousState?.courses || []).filter(
    (c) => c.connectorId === 'canvas' && referencedCourseIds.has(c.id) && !freshCourseIds.has(c.id)
  );
  const allCourses = [...courses, ...retainedCourses];

  return {
    connectors: {
      canvas: {
        id: 'canvas',
        name: 'Canvas',
        status: 'connected',
        connectionMode: 'live',
        capabilities: ['courses', 'assignments', 'files', 'grades', 'assessment review'],
        lastSyncedAt: today.toISOString(),
      },
    },
    courses: allCourses,
    assignments: allAssignments,
    files: allFiles,
    studyPacks,
    syncHistory: [
      {
        id: `sync-canvas-live-${today.getTime()}`,
        connectorId: 'canvas',
        label: 'Canvas live sync',
        completedAt: today.toISOString(),
      },
      ...(previousState?.syncHistory || []).slice(0, 4),
    ],
  };
}

function buildChecklist(assignment, course, mode, modeConfig) {
  const focusMinutes = modeConfig?.timer?.focus || 25;

  if (mode === 'adhd') {
    return [
      `Do one ${Math.min(focusMinutes, 12)} minute sprint on the hardest part first`,
      'Take a quick movement break',
      'Finish one more short block and submit a draft version',
    ];
  }

  if (mode === 'add') {
    return [
      'Open the assignment and identify the exact deliverable',
      `Work through the task in ${focusMinutes}-minute blocks with clear checkpoints`,
      'End by marking the task as submitted or scheduling the next block',
    ];
  }

  if (mode === 'dyslexia') {
    return [
      'Listen to the assignment instructions with text-to-speech',
      'Pull out 3 key ideas before reading details',
      'Review one concept at a time and check for understanding',
    ];
  }

  return [
    'Review the lecture materials linked to this assignment',
    `Complete one ${focusMinutes}-minute focus block`,
    'Quiz yourself before you submit or review',
  ];
}

function buildFlashcards(assignment, course) {
  const topics = (course?.topics || []).slice(0, 3);
  if (topics.length === 0) {
    return [
      { front: `What is the main concept in "${assignment.title}"?`, back: `Review ${assignment.title} to answer this.` },
    ];
  }
  return topics.map((topic, i) => ({
    front: `${course.name}: What is important about ${topic}?`,
    back: `Review how ${topic} relates to ${assignment.title}.`,
  }));
}
