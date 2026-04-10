import { addDays } from '../lib/dateUtils.js';
import { slugify } from '../lib/textUtils.js';

const COURSE_LIBRARY = {
  'middle-school': [
    {
      code: 'SCI-7',
      name: 'Life Science',
      instructor: 'Ms. Patel',
      color: '#14b8a6',
      currentGrade: 91,
      topics: ['cell parts', 'photosynthesis', 'food chains'],
      files: [
        { title: 'Cell Structure Slides', kind: 'slides' },
        { title: 'Photosynthesis Reading Guide', kind: 'reading' },
      ],
      assignments: [
        { title: 'Cell Model Reflection', type: 'assignment', dueInDays: 1, estimatedMinutes: 35, status: 'in_progress', topic: 'cell parts' },
        { title: 'Photosynthesis Quiz', type: 'quiz', dueInDays: 4, estimatedMinutes: 25, status: 'pending', topic: 'photosynthesis', scoreHint: 74, reviewAvailable: true },
      ],
    },
    {
      code: 'ELA-7',
      name: 'English Language Arts',
      instructor: 'Mr. Gomez',
      color: '#f97316',
      currentGrade: 87,
      topics: ['theme', 'evidence', 'character motivation'],
      files: [
        { title: 'Theme and Evidence Notes', kind: 'reading' },
        { title: 'Novel Discussion Prompts', kind: 'worksheet' },
      ],
      assignments: [
        { title: 'Theme Paragraph Draft', type: 'assignment', dueInDays: 2, estimatedMinutes: 40, status: 'pending', topic: 'theme' },
        { title: 'Reading Check', type: 'quiz', dueInDays: 6, estimatedMinutes: 20, status: 'pending', topic: 'character motivation', scoreHint: 82 },
      ],
    },
    {
      code: 'MATH-7',
      name: 'Math Foundations',
      instructor: 'Mrs. Lewis',
      color: '#3b82f6',
      currentGrade: 84,
      topics: ['fractions', 'ratios', 'proportions'],
      files: [
        { title: 'Ratio Practice Set', kind: 'worksheet' },
        { title: 'Proportions Example Sheet', kind: 'slides' },
      ],
      assignments: [
        { title: 'Ratio Practice Review', type: 'assignment', dueInDays: 3, estimatedMinutes: 30, status: 'pending', topic: 'ratios' },
        { title: 'Unit Test: Ratios and Proportions', type: 'exam', dueInDays: 8, estimatedMinutes: 60, status: 'pending', topic: 'proportions', scoreHint: 68, reviewAvailable: true },
      ],
    },
  ],
  'high-school': [
    {
      code: 'BIO-201',
      name: 'Biology',
      instructor: 'Dr. Ramirez',
      color: '#10b981',
      currentGrade: 88,
      topics: ['cellular respiration', 'mitosis', 'enzymes'],
      files: [
        { title: 'Cell Respiration Lecture Slides', kind: 'slides' },
        { title: 'Mitosis Practice Diagram', kind: 'worksheet' },
        { title: 'Enzymes Lab Instructions', kind: 'lab' },
      ],
      assignments: [
        { title: 'Enzymes Lab Analysis', type: 'assignment', dueInDays: 1, estimatedMinutes: 45, status: 'in_progress', topic: 'enzymes' },
        { title: 'Mitosis Quiz', type: 'quiz', dueInDays: 3, estimatedMinutes: 25, status: 'pending', topic: 'mitosis', scoreHint: 72, reviewAvailable: true },
        { title: 'Cell Energy Unit Exam', type: 'exam', dueInDays: 9, estimatedMinutes: 75, status: 'pending', topic: 'cellular respiration', scoreHint: 69, reviewAvailable: true },
      ],
    },
    {
      code: 'USH-110',
      name: 'U.S. History',
      instructor: 'Ms. Carter',
      color: '#f97316',
      currentGrade: 93,
      topics: ['progressive era', 'new deal', 'civil rights'],
      files: [
        { title: 'Progressive Era Source Packet', kind: 'reading' },
        { title: 'New Deal Timeline Slides', kind: 'slides' },
      ],
      assignments: [
        { title: 'Primary Source Annotation', type: 'assignment', dueInDays: 2, estimatedMinutes: 35, status: 'pending', topic: 'progressive era' },
        { title: 'Civil Rights Seminar Prep', type: 'reading', dueInDays: 5, estimatedMinutes: 30, status: 'pending', topic: 'civil rights' },
      ],
    },
    {
      code: 'ALG-220',
      name: 'Algebra II',
      instructor: 'Mr. Nguyen',
      color: '#6366f1',
      currentGrade: 79,
      topics: ['quadratics', 'exponential functions', 'polynomial factoring'],
      files: [
        { title: 'Quadratics Review Video Notes', kind: 'lecture' },
        { title: 'Polynomial Factoring Practice', kind: 'worksheet' },
      ],
      assignments: [
        { title: 'Quadratics Homework Set', type: 'assignment', dueInDays: 1, estimatedMinutes: 40, status: 'pending', topic: 'quadratics' },
        { title: 'Functions Checkpoint', type: 'quiz', dueInDays: 4, estimatedMinutes: 25, status: 'pending', topic: 'exponential functions', scoreHint: 65, reviewAvailable: true },
      ],
    },
  ],
  college: [
    {
      code: 'BIOC-310',
      name: 'Cell Biology',
      instructor: 'Prof. Singh',
      color: '#10b981',
      currentGrade: 86,
      topics: ['membrane transport', 'signal transduction', 'cell cycle'],
      files: [
        { title: 'Membrane Transport Slides', kind: 'slides' },
        { title: 'Signal Transduction Review Sheet', kind: 'reading' },
      ],
      assignments: [
        { title: 'Signal Pathways Discussion Post', type: 'assignment', dueInDays: 1, estimatedMinutes: 50, status: 'in_progress', topic: 'signal transduction' },
        { title: 'Cell Cycle Midterm', type: 'exam', dueInDays: 7, estimatedMinutes: 90, status: 'pending', topic: 'cell cycle', scoreHint: 71, reviewAvailable: true },
      ],
    },
    {
      code: 'PSYC-240',
      name: 'Cognitive Psychology',
      instructor: 'Dr. Mills',
      color: '#8b5cf6',
      currentGrade: 90,
      topics: ['memory models', 'attention', 'decision making'],
      files: [
        { title: 'Attention Lecture Recording Notes', kind: 'lecture' },
        { title: 'Memory Models Summary', kind: 'reading' },
      ],
      assignments: [
        { title: 'Attention Article Summary', type: 'assignment', dueInDays: 2, estimatedMinutes: 45, status: 'pending', topic: 'attention' },
        { title: 'Memory Models Quiz', type: 'quiz', dueInDays: 4, estimatedMinutes: 25, status: 'pending', topic: 'memory models', scoreHint: 78, reviewAvailable: true },
      ],
    },
    {
      code: 'STAT-225',
      name: 'Statistics',
      instructor: 'Prof. Adler',
      color: '#3b82f6',
      currentGrade: 81,
      topics: ['hypothesis testing', 'confidence intervals', 'sampling error'],
      files: [
        { title: 'Confidence Intervals Walkthrough', kind: 'slides' },
        { title: 'Sampling Error Homework Guide', kind: 'worksheet' },
      ],
      assignments: [
        { title: 'Hypothesis Testing Problem Set', type: 'assignment', dueInDays: 3, estimatedMinutes: 55, status: 'pending', topic: 'hypothesis testing' },
        { title: 'Statistics Review Exam', type: 'exam', dueInDays: 10, estimatedMinutes: 90, status: 'pending', topic: 'confidence intervals', scoreHint: 67, reviewAvailable: true },
      ],
    },
  ],
};

function buildPackFlashcards(course, assignment) {
  return course.topics.slice(0, 3).map((topic, index) => ({
    front: `${course.name}: ${topic} concept ${index + 1}`,
    back: `Explain how ${topic} connects to ${assignment.title.toLowerCase()}.`,
  }));
}

function buildChecklist(assignment, mode, modeConfig) {
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
      'Listen to the lecture file or assignment instructions with text-to-speech',
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

export function buildStudyPack(course, assignment, mode, modeConfig) {
  const assignmentSlug = slugify(assignment.title);
  const courseSlug = slugify(course.name);
  const isExam = assignment.type === 'exam' || assignment.type === 'quiz';

  return {
    id: `pack-${courseSlug}-${assignmentSlug}`,
    courseId: `course-${courseSlug}`,
    sourceId: `assignment-${courseSlug}-${assignmentSlug}`,
    sourceType: assignment.type,
    title: `${assignment.title} Study Pack`,
    summary: `A guided prep pack for ${assignment.title} in ${course.name}, with a focus on ${assignment.topic}.`,
    dueAt: assignment.dueAt,
    weakTopics: assignment.scoreHint && assignment.scoreHint < 75 ? [assignment.topic] : [],
    checklist: buildChecklist(assignment, mode, modeConfig),
    completedChecklist: [],
    flashcards: buildPackFlashcards(course, assignment),
    recommendedSessionMinutes: Math.min(modeConfig?.timer?.focus || 25, isExam ? 30 : assignment.estimatedMinutes),
    linkedDeckId: null,
    focusReflection: '',
    reviewAvailable: Boolean(assignment.reviewAvailable),
    reviewSummary: assignment.reviewAvailable
      ? `Review is available for ${assignment.title}. Focus on missed questions about ${assignment.topic}.`
      : 'Review details are not yet available from the LMS.',
  };
}

export function buildCanvasDemoState({ user, mode, modeConfig, previousState }) {
  const gradeLevel = user?.gradeLevel || 'high-school';
  const library = COURSE_LIBRARY[gradeLevel] || COURSE_LIBRARY['high-school'];
  const today = new Date();

  const previousPacks = new Map((previousState?.studyPacks || []).map((pack) => [pack.id, pack]));

  const courses = library.map((course) => {
    const courseSlug = slugify(course.name);
    return {
      id: `course-${courseSlug}`,
      connectorId: 'canvas',
      code: course.code,
      name: course.name,
      instructor: course.instructor,
      color: course.color,
      currentGrade: course.currentGrade,
      focusTopic: course.topics[0],
      topics: course.topics,
      syncedAt: today.toISOString(),
    };
  });

  const files = library.flatMap((course) => {
    const courseSlug = slugify(course.name);
    return course.files.map((file) => ({
      id: `file-${courseSlug}-${slugify(file.title)}`,
      courseId: `course-${courseSlug}`,
      title: file.title,
      kind: file.kind,
      connectorId: 'canvas',
      importedAt: today.toISOString(),
      url: '#',
    }));
  });

  const assignments = library.flatMap((course) => {
    const courseSlug = slugify(course.name);
    return course.assignments.map((assignment) => {
      const assignmentSlug = slugify(assignment.title);
      return {
        id: `assignment-${courseSlug}-${assignmentSlug}`,
        courseId: `course-${courseSlug}`,
        connectorId: 'canvas',
        title: assignment.title,
        type: assignment.type,
        topic: assignment.topic,
        dueAt: addDays(today, assignment.dueInDays).toISOString(),
        estimatedMinutes: assignment.estimatedMinutes,
        status: assignment.status,
        scoreHint: assignment.scoreHint ?? null,
        reviewAvailable: Boolean(assignment.reviewAvailable),
        description: `Imported from Canvas demo sync for ${course.name}.`,
      };
    });
  });

  const studyPacks = assignments
    .filter((assignment) => assignment.type !== 'reading')
    .map((assignment) => {
      const course = courses.find((item) => item.id === assignment.courseId);
      const generatedPack = buildStudyPack(course, assignment, mode, modeConfig);
      const previousPack = previousPacks.get(generatedPack.id);

      return previousPack
        ? {
            ...generatedPack,
            linkedDeckId: previousPack.linkedDeckId || null,
            completedChecklist: previousPack.completedChecklist || [],
            focusReflection: previousPack.focusReflection || '',
          }
        : generatedPack;
    });

  return {
    connectors: {
      canvas: {
        id: 'canvas',
        name: 'Canvas',
        status: 'connected',
        connectionMode: 'demo',
        capabilities: ['courses', 'assignments', 'files', 'grades', 'assessment review'],
        lastSyncedAt: today.toISOString(),
      },
    },
    courses,
    assignments,
    files,
    studyPacks,
    syncHistory: [
      {
        id: `sync-canvas-${today.getTime()}`,
        connectorId: 'canvas',
        label: 'Canvas demo sync',
        completedAt: today.toISOString(),
      },
      ...(previousState?.syncHistory || []).slice(0, 4),
    ],
  };
}
