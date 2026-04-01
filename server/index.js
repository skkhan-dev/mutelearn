import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';
import { buildCanvasDemoState, buildStudyPack } from '../src/data/lmsDemoData.js';
import { slugify, stablePick } from '../src/lib/textUtils.js';
import { createPersistentStateStore } from './stateStore.js';

const PORT = Number(process.env.MUTELEARN_SERVER_PORT || 8787);
const APP_URL = process.env.MUTELEARN_APP_URL || 'http://localhost:5173';
const APP_ORIGIN = new URL(APP_URL).origin;
const CANVAS_BASE_URL = (process.env.CANVAS_BASE_URL || '').replace(/\/+$/, '');
const CANVAS_CLIENT_ID = process.env.CANVAS_CLIENT_ID || '';
const CANVAS_CLIENT_SECRET = process.env.CANVAS_CLIENT_SECRET || '';
const CANVAS_REDIRECT_URI =
  process.env.CANVAS_REDIRECT_URI ||
  `http://localhost:${PORT}/api/connectors/canvas/oauth/callback`;

const stateStore = createPersistentStateStore();

const CANVAS_COURSE_COLORS = [
  '#10b981',
  '#6366f1',
  '#f97316',
  '#14b8a6',
  '#8b5cf6',
  '#3b82f6',
];

const CANVAS_CAPABILITIES = [
  'courses',
  'assignments',
  'files',
  'grades',
  'assessment review',
];

function isCanvasOauthConfigured() {
  return Boolean(CANVAS_BASE_URL && CANVAS_CLIENT_ID && CANVAS_CLIENT_SECRET);
}

function normalizeHeaderValue(value) {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': APP_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, x-mutelearn-session',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  response.end(JSON.stringify(payload));
}

function sendHtml(response, statusCode, html) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': APP_ORIGIN,
  });
  response.end(html);
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

function getSessionToken(request) {
  return normalizeHeaderValue(request.headers['x-mutelearn-session']);
}

function getSessionRecord(request) {
  const token = getSessionToken(request);
  return {
    token,
    session: token ? stateStore.getSession(token) : null,
  };
}

function findSessionById(sessionId) {
  return stateStore.findSessionById(sessionId);
}

function persistSession(sessionRecord) {
  if (sessionRecord?.token && sessionRecord?.session) {
    stateStore.setSession(sessionRecord.token, sessionRecord.session);
  }
}

function sanitizeCanvasOauth(oauthCanvas = null) {
  if (!oauthCanvas) return null;

  return {
    status: oauthCanvas.status || 'disconnected',
    accountName: oauthCanvas.accountName || null,
    canvasUserId: oauthCanvas.canvasUserId || null,
    authorizedAt: oauthCanvas.authorizedAt || null,
    expiresAt: oauthCanvas.expiresAt || null,
    hasRefreshToken: Boolean(oauthCanvas.refreshToken),
    lastError: oauthCanvas.lastError || '',
  };
}

function serializeSession(session) {
  if (!session) return null;

  return {
    id: session.id,
    user: session.user,
    issuedAt: session.issuedAt,
    connectors: session.connectors,
    oauth: {
      canvas: sanitizeCanvasOauth(session.oauth?.canvas),
    },
  };
}

function serializeJob(job) {
  return {
    id: job.id,
    connectorId: job.connectorId,
    source: job.source,
    status: job.status,
    queuedAt: job.queuedAt || null,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt || null,
    summary: job.summary || '',
    error: job.error || '',
  };
}

function listSessionJobs(session, connectorId, limit = 8) {
  if (!session?.id) return [];

  return stateStore
    .listJobs({
      sessionId: session.id,
      connectorId,
      limit,
    })
    .map(serializeJob);
}

function createSyncJob(session, connectorId, source) {
  if (!session?.id) return null;

  const now = new Date().toISOString();
  return stateStore.createJob({
    id: `job-${randomUUID()}`,
    sessionId: session.id,
    connectorId,
    source,
    status: 'running',
    queuedAt: now,
    startedAt: now,
    finishedAt: null,
    summary: '',
    error: '',
  });
}

function completeSyncJob(job, patch) {
  if (!job?.id) return null;

  return stateStore.updateJob(job.id, {
    ...patch,
    finishedAt: patch.finishedAt || new Date().toISOString(),
  });
}

function setCanvasSnapshot(session, lmsState) {
  session.lmsSnapshots = {
    ...(session.lmsSnapshots || {}),
    canvas: lmsState,
  };
}

function getCanvasSnapshot(session) {
  return session?.lmsSnapshots?.canvas || null;
}

function summarizeSyncPayload(payload) {
  return `${payload.lmsState.courses.length} courses, ${payload.lmsState.assignments.length} assignments, ${payload.lmsState.studyPacks.length} study packs`;
}

const queuedSyncJobs = [];
let isProcessingQueuedSyncJobs = false;

function enqueueSyncJob(jobId) {
  if (!jobId || queuedSyncJobs.includes(jobId)) return;
  queuedSyncJobs.push(jobId);
  if (!isProcessingQueuedSyncJobs) {
    setTimeout(() => {
      void processQueuedSyncJobs();
    }, 0);
  }
}

function canvasConnectorDescriptor(session) {
  const sessionCanvas = session?.connectors?.canvas || {};
  const oauthCanvas = session?.oauth?.canvas || null;
  const oauthConfigured = isCanvasOauthConfigured();

  return {
    id: 'canvas',
    name: 'Canvas',
    status: sessionCanvas.status || 'disconnected',
    connectionMode:
      sessionCanvas.connectionMode ||
      (oauthCanvas?.accessToken ? 'live' : oauthConfigured ? 'oauth-ready' : 'demo-only'),
    capabilities: CANVAS_CAPABILITIES,
    lastSyncedAt: sessionCanvas.lastSyncedAt || null,
    oauthConfigured,
    baseUrlConfigured: Boolean(CANVAS_BASE_URL),
    accountName: oauthCanvas?.accountName || null,
    authStatus: oauthCanvas?.status || 'disconnected',
    courseCount: sessionCanvas.courseCount || 0,
    lastSyncSource: sessionCanvas.lastSyncSource || null,
  };
}

function updateCanvasConnector(session, patch) {
  session.connectors.canvas = {
    ...(session.connectors.canvas || {
      status: 'disconnected',
      lastSyncedAt: null,
      connectionMode: 'demo',
      lastSyncSource: null,
      courseCount: 0,
    }),
    ...patch,
  };
}

function updateCanvasOauth(session, patch) {
  session.oauth.canvas = {
    ...(session.oauth.canvas || {}),
    ...patch,
  };
}

function createDemoState(requestBody, session) {
  const user = requestBody.user || session?.user || { name: 'Learner', gradeLevel: 'high-school' };

  return buildCanvasDemoState({
    user,
    mode: requestBody.mode || 'default',
    modeConfig: requestBody.modeConfig || { timer: { focus: 25 } },
    previousState: requestBody.previousState || null,
  });
}

function buildCanvasAuthorizationUrl(state) {
  const authorizationUrl = new URL('/login/oauth2/auth', CANVAS_BASE_URL);
  authorizationUrl.searchParams.set('client_id', CANVAS_CLIENT_ID);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('redirect_uri', CANVAS_REDIRECT_URI);
  authorizationUrl.searchParams.set('state', state);
  return authorizationUrl.toString();
}

function buildCanvasTokenUrl() {
  return new URL('/login/oauth2/token', CANVAS_BASE_URL).toString();
}

function buildCanvasApiUrl(pathOrUrl) {
  if (typeof pathOrUrl === 'string' && pathOrUrl.startsWith('http')) {
    return pathOrUrl;
  }

  return new URL(pathOrUrl, CANVAS_BASE_URL).toString();
}

async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

function buildCanvasTokenState(existingOauth = {}, payload = {}) {
  const now = Date.now();
  const expiresInSeconds = Number(payload.expires_in || 0);

  return {
    ...existingOauth,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || existingOauth.refreshToken || '',
    tokenType: payload.token_type || 'Bearer',
    scope: payload.scope || existingOauth.scope || '',
    expiresAt: expiresInSeconds
      ? new Date(now + expiresInSeconds * 1000).toISOString()
      : existingOauth.expiresAt || null,
    authorizedAt: existingOauth.authorizedAt || new Date(now).toISOString(),
    status: 'authorized',
    lastError: '',
  };
}

async function exchangeCanvasToken(params) {
  const response = await fetch(buildCanvasTokenUrl(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: params.grantType,
      client_id: CANVAS_CLIENT_ID,
      client_secret: CANVAS_CLIENT_SECRET,
      redirect_uri: CANVAS_REDIRECT_URI,
      ...(params.code ? { code: params.code } : {}),
      ...(params.refreshToken ? { refresh_token: params.refreshToken } : {}),
    }),
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload.error_description || payload.error || 'Canvas token exchange failed.';
    throw new Error(message);
  }

  return payload;
}

function tokenExpiresSoon(expiresAt, bufferMs = 120000) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() - Date.now() <= bufferMs;
}

async function refreshCanvasToken(session) {
  const oauthCanvas = session.oauth?.canvas;

  if (!oauthCanvas?.refreshToken) {
    throw new Error('Canvas refresh token is not available.');
  }

  const payload = await exchangeCanvasToken({
    grantType: 'refresh_token',
    refreshToken: oauthCanvas.refreshToken,
  });

  updateCanvasOauth(session, buildCanvasTokenState(oauthCanvas, payload));
  return session.oauth.canvas.accessToken;
}

async function ensureCanvasAccessToken(session) {
  const oauthCanvas = session.oauth?.canvas;

  if (!oauthCanvas?.accessToken) {
    throw new Error('Connect Canvas before starting a live sync.');
  }

  if (tokenExpiresSoon(oauthCanvas.expiresAt) && oauthCanvas.refreshToken) {
    await refreshCanvasToken(session);
  }

  return session.oauth.canvas.accessToken;
}

function parseNextLink(linkHeader) {
  if (!linkHeader) return null;

  const links = linkHeader.split(',');
  for (const link of links) {
    const parts = link.split(';').map((part) => part.trim());
    const href = parts[0]?.match(/<(.+)>/)?.[1];
    const rel = parts[1]?.match(/rel="(.+)"/)?.[1];
    if (href && rel === 'next') {
      return href;
    }
  }

  return null;
}

async function fetchCanvasJson(session, pathOrUrl, { allowRefresh = true } = {}) {
  const accessToken = await ensureCanvasAccessToken(session);
  const response = await fetch(buildCanvasApiUrl(pathOrUrl), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401 && allowRefresh && session.oauth?.canvas?.refreshToken) {
    await refreshCanvasToken(session);
    return fetchCanvasJson(session, pathOrUrl, { allowRefresh: false });
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload.errors?.[0]?.message || payload.error || 'Canvas request failed.';
    throw new Error(message);
  }

  return {
    payload,
    headers: response.headers,
  };
}

async function fetchCanvasCollection(session, pathOrUrl, maxPages = 4) {
  let nextUrl = buildCanvasApiUrl(pathOrUrl);
  const items = [];
  let pageCount = 0;

  while (nextUrl && pageCount < maxPages) {
    const { payload, headers } = await fetchCanvasJson(session, nextUrl);
    if (Array.isArray(payload)) {
      items.push(...payload);
    }
    nextUrl = parseNextLink(headers.get('link'));
    pageCount += 1;
  }

  return items;
}

async function fetchCanvasProfile(session) {
  const { payload } = await fetchCanvasJson(session, '/api/v1/users/self/profile');
  return payload;
}

function stripHtml(value = '') {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toFiniteNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function inferCourseGrade(course) {
  const enrollment = Array.isArray(course.enrollments) ? course.enrollments[0] : null;
  const candidates = [
    course.current_score,
    course.final_score,
    enrollment?.computed_current_score,
    enrollment?.computed_final_score,
    enrollment?.current_score,
    enrollment?.final_score,
  ];

  for (const candidate of candidates) {
    const score = toFiniteNumber(candidate);
    if (score !== null) return Math.round(score);
  }

  return null;
}

function inferAssignmentType(assignment) {
  const title = `${assignment.name || ''} ${stripHtml(assignment.description || '')}`.toLowerCase();
  const submissionTypes = assignment.submission_types || [];
  const isQuiz = Boolean(assignment.quiz_id || submissionTypes.includes('online_quiz'));
  const isExamLike = /(exam|midterm|final|test)/.test(title);

  if (isQuiz && isExamLike) return 'exam';
  if (isQuiz) return 'quiz';
  if (isExamLike) return 'exam';
  if (/(reading|chapter|article|source packet|seminar prep)/.test(title)) return 'reading';
  return 'assignment';
}

function inferAssignmentTopic(assignment, courseName) {
  const base = (assignment.name || '')
    .replace(/\b(quiz|exam|midterm|final|test|homework|assignment|discussion|checkpoint|review)\b/gi, '')
    .replace(/[|:-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (base) return base.toLowerCase();
  return courseName.toLowerCase();
}

function inferAssignmentStatus(assignment) {
  const submission = assignment.submission || null;
  const hasSubmission =
    Boolean(submission?.submitted_at) ||
    Boolean(submission?.attempt) ||
    submission?.workflow_state === 'submitted' ||
    submission?.workflow_state === 'graded';

  if (submission?.workflow_state === 'graded') return 'completed';
  if (hasSubmission) return 'submitted';
  if (assignment.due_at && new Date(assignment.due_at).getTime() < Date.now()) return 'in_progress';
  return 'pending';
}

function inferScoreHint(assignment) {
  const submission = assignment.submission || null;
  const pointsPossible = toFiniteNumber(assignment.points_possible);
  const rawScore = toFiniteNumber(submission?.score);

  if (rawScore !== null && pointsPossible && pointsPossible > 0) {
    return Math.max(0, Math.min(100, Math.round((rawScore / pointsPossible) * 100)));
  }

  return null;
}

function inferReviewAvailability(assignment) {
  const submission = assignment.submission || null;
  return Boolean(
    assignment.quiz_id ||
      submission?.workflow_state === 'graded' ||
      submission?.score != null ||
      submission?.attempt
  );
}

function inferFileKind(file) {
  const title = `${file.display_name || file.filename || ''}`.toLowerCase();
  const contentType = `${file['content-type'] || file.content_type || ''}`.toLowerCase();

  if (/(lecture|recording|video)/.test(title) || /(video|audio)\//.test(contentType)) {
    return 'lecture';
  }
  if (/(slides|deck|ppt|pptx)/.test(title)) return 'slides';
  if (/lab/.test(title)) return 'lab';
  if (/(worksheet|practice|problem set)/.test(title)) return 'worksheet';
  return 'reading';
}

function estimateAssignmentMinutes(type) {
  if (type === 'exam') return 75;
  if (type === 'quiz') return 30;
  if (type === 'reading') return 25;
  return 45;
}

function shouldKeepCanvasAssignment(normalizedAssignment) {
  const dueAt = normalizedAssignment.dueAt ? new Date(normalizedAssignment.dueAt).getTime() : null;
  const hasScore = normalizedAssignment.scoreHint !== null;
  const recentWindowStart = Date.now() - 1000 * 60 * 60 * 24 * 21;

  if (hasScore) return true;
  if (!dueAt) return false;
  return dueAt >= recentWindowStart;
}

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildCallbackHtml({ title, message, detail = '', success = true }) {
  const payload = JSON.stringify({
    type: 'mutelearn-canvas-oauth-complete',
    success,
  });

  return `
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 760px; margin: 48px auto; padding: 0 20px; color: #111827; }
          .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px; }
          .pill { display: inline-block; border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 700; background: ${
            success ? '#dcfce7' : '#fef2f2'
          }; color: ${success ? '#166534' : '#991b1b'}; }
          code { background: #f3f4f6; padding: 2px 6px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="card">
          <span class="pill">${success ? 'Canvas connected' : 'Canvas connection needs attention'}</span>
          <p style="margin-top: 16px;">${escapeHtml(message)}</p>
          ${detail ? `<p style="margin-top: 12px; color: #4b5563;">${escapeHtml(detail)}</p>` : ''}
          <p style="margin-top: 12px; color: #6b7280;">You can return to MuteLearn now. ${
            success ? 'The app can refresh connector status and you can run a live sync.' : 'Try the auth step again after fixing the issue.'
          }</p>
        </div>
        <script>
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(${payload}, ${JSON.stringify(APP_ORIGIN)});
              window.setTimeout(() => window.close(), 900);
            }
          } catch {}
        </script>
      </body>
    </html>
  `;
}

function normalizeCanvasCourse(course, syncedAt) {
  return {
    id: `course-canvas-${course.id}`,
    canvasCourseId: String(course.id),
    connectorId: 'canvas',
    code: course.course_code || `COURSE-${course.id}`,
    name: course.name || `Canvas Course ${course.id}`,
    instructor:
      course.teachers?.map((teacher) => teacher.display_name || teacher.name).filter(Boolean).join(', ') ||
      'Instructor',
    color: stablePick(CANVAS_COURSE_COLORS, `${course.id}-${course.name}`),
    currentGrade: inferCourseGrade(course),
    focusTopic: null,
    topics: [],
    syncedAt,
  };
}

function normalizeCanvasAssignment(course, assignment, syncedAt) {
  const type = inferAssignmentType(assignment);
  const titleSlug = slugify(`${course.id}-${assignment.name || assignment.id}`);

  return {
    id: `assignment-${titleSlug}`,
    courseId: course.id,
    connectorId: 'canvas',
    canvasAssignmentId: String(assignment.id),
    title: assignment.name || 'Untitled assignment',
    type,
    topic: inferAssignmentTopic(assignment, course.name),
    dueAt:
      assignment.due_at ||
      assignment.lock_at ||
      assignment.unlock_at ||
      assignment.updated_at ||
      syncedAt,
    estimatedMinutes: estimateAssignmentMinutes(type),
    status: inferAssignmentStatus(assignment),
    scoreHint: inferScoreHint(assignment),
    reviewAvailable: inferReviewAvailability(assignment),
    description:
      stripHtml(assignment.description || '') || `Imported from Canvas course ${course.name}.`,
  };
}

function normalizeCanvasFile(course, file, syncedAt) {
  const title = file.display_name || file.filename || 'Course file';
  return {
    id: `file-${slugify(`${course.id}-${title}`)}`,
    courseId: course.id,
    connectorId: 'canvas',
    title,
    kind: inferFileKind(file),
    importedAt: file.updated_at || syncedAt,
    url: file.url || file.html_url || '#',
  };
}

async function fetchCanvasAssignmentsForCourse(session, courseId) {
  const assignmentsUrl = new URL(`/api/v1/courses/${courseId}/assignments`, CANVAS_BASE_URL);
  assignmentsUrl.searchParams.append('include[]', 'submission');
  assignmentsUrl.searchParams.set('order_by', 'due_at');
  assignmentsUrl.searchParams.set('per_page', '15');
  return fetchCanvasCollection(session, assignmentsUrl.toString(), 2);
}

async function fetchCanvasFilesForCourse(session, courseId) {
  const filesUrl = new URL(`/api/v1/courses/${courseId}/files`, CANVAS_BASE_URL);
  filesUrl.searchParams.set('sort', 'updated_at');
  filesUrl.searchParams.set('order', 'desc');
  filesUrl.searchParams.set('per_page', '8');
  return fetchCanvasCollection(session, filesUrl.toString(), 2);
}

async function buildCanvasLiveState({ session, mode, modeConfig, previousState }) {
  const syncedAt = new Date().toISOString();
  const previousPacks = new Map((previousState?.studyPacks || []).map((pack) => [pack.id, pack]));

  const profile = await fetchCanvasProfile(session).catch(() => null);
  if (profile) {
    updateCanvasOauth(session, {
      accountName: profile.name || profile.primary_email || 'Canvas account',
      canvasUserId: profile.id || null,
      status: 'authorized',
      lastError: '',
    });
  }

  const coursesUrl = new URL('/api/v1/courses', CANVAS_BASE_URL);
  coursesUrl.searchParams.set('enrollment_state', 'active');
  coursesUrl.searchParams.append('include[]', 'teachers');
  coursesUrl.searchParams.append('include[]', 'total_scores');
  coursesUrl.searchParams.set('per_page', '8');

  const rawCourses = await fetchCanvasCollection(session, coursesUrl.toString(), 2);
  const selectedCourses = rawCourses
    .filter((course) => course && !course.access_restricted_by_date)
    .slice(0, 6)
    .map((course) => normalizeCanvasCourse(course, syncedAt));

  const assignmentResults = await Promise.allSettled(
    selectedCourses.map((course) => fetchCanvasAssignmentsForCourse(session, course.canvasCourseId))
  );

  const fileResults = await Promise.allSettled(
    selectedCourses.map((course) => fetchCanvasFilesForCourse(session, course.canvasCourseId))
  );

  const assignments = assignmentResults.flatMap((result, index) => {
    if (result.status !== 'fulfilled') return [];
    return result.value
      .map((assignment) => normalizeCanvasAssignment(selectedCourses[index], assignment, syncedAt))
      .filter(shouldKeepCanvasAssignment);
  });

  const topicsByCourseId = new Map();
  for (const assignment of assignments) {
    if (!assignment.topic) continue;
    const existing = topicsByCourseId.get(assignment.courseId) || [];
    if (!existing.includes(assignment.topic)) {
      topicsByCourseId.set(assignment.courseId, [...existing, assignment.topic].slice(0, 4));
    }
  }

  const courses = selectedCourses.map((course) => {
    const topics = topicsByCourseId.get(course.id) || [course.name.toLowerCase()];
    return {
      ...course,
      topics,
      focusTopic: topics[0] || course.name.toLowerCase(),
    };
  });

  const files = fileResults.flatMap((result, index) => {
    if (result.status !== 'fulfilled') return [];
    return result.value.map((file) => normalizeCanvasFile(courses[index], file, syncedAt));
  });

  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const studyPacks = assignments
    .filter(
      (assignment) =>
        assignment.type !== 'reading' &&
        (['pending', 'in_progress'].includes(assignment.status) || assignment.reviewAvailable)
    )
    .map((assignment) => {
      const course = courseMap.get(assignment.courseId);
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
        connectionMode: 'live',
        capabilities: CANVAS_CAPABILITIES,
        lastSyncedAt: syncedAt,
      },
    },
    courses,
    assignments,
    files,
    studyPacks,
    syncHistory: [
      {
        id: `sync-canvas-live-${Date.now()}`,
        connectorId: 'canvas',
        label: 'Canvas live sync',
        completedAt: syncedAt,
      },
      ...(previousState?.syncHistory || []).slice(0, 4),
    ],
  };
}

async function performCanvasSync(session, requestBody) {
  if (session?.oauth?.canvas?.accessToken && isCanvasOauthConfigured()) {
    const lmsState = await buildCanvasLiveState({
      session,
      mode: requestBody.mode || 'default',
      modeConfig: requestBody.modeConfig || { timer: { focus: 25 } },
      previousState: requestBody.previousState || null,
    });

    updateCanvasConnector(session, {
      status: 'connected',
      connectionMode: 'live',
      lastSyncedAt: lmsState.connectors.canvas.lastSyncedAt,
      lastSyncSource: 'canvas-live',
      courseCount: lmsState.courses.length,
    });

    return {
      source: 'canvas-live',
      lmsState,
    };
  }

  const lmsState = createDemoState(requestBody, session);
  if (session) {
    updateCanvasConnector(session, {
      status: 'connected',
      connectionMode: 'demo',
      lastSyncedAt: lmsState.connectors.canvas.lastSyncedAt,
      lastSyncSource: 'server-demo',
      courseCount: lmsState.courses.length,
    });
  }

  return {
    source: 'server-demo',
    lmsState,
  };
}

function createQueuedCanvasSyncJob(session, requestBody) {
  if (!session?.id) return null;

  const now = new Date().toISOString();
  const source = session?.oauth?.canvas?.accessToken ? 'canvas-live' : 'server-demo';
  const job = stateStore.createJob({
    id: `job-${randomUUID()}`,
    sessionId: session.id,
    connectorId: 'canvas',
    source,
    status: 'queued',
    queuedAt: now,
    startedAt: null,
    finishedAt: null,
    requestBody,
    summary: 'Waiting for the local sync worker.',
    error: '',
  });

  enqueueSyncJob(job.id);
  return job;
}

async function processQueuedSyncJobs() {
  if (isProcessingQueuedSyncJobs) return;
  isProcessingQueuedSyncJobs = true;

  try {
    while (queuedSyncJobs.length > 0) {
      const jobId = queuedSyncJobs.shift();
      const job = stateStore.getJob(jobId);
      if (!job || !['queued', 'running'].includes(job.status)) {
        continue;
      }

      const sessionRecord = findSessionById(job.sessionId);
      if (!sessionRecord?.session) {
        completeSyncJob(job, {
          status: 'failed',
          error: 'The dev session for this sync job is no longer available.',
        });
        continue;
      }

      const session = sessionRecord.session;
      const runningJob = stateStore.updateJob(job.id, {
        status: 'running',
        startedAt: new Date().toISOString(),
        error: '',
        summary: 'Syncing Canvas coursework into MuteLearn.',
      });

      try {
        if (session.oauth?.canvas?.status === 'error') {
          updateCanvasOauth(session, {
            status: 'authorized',
            lastError: '',
          });
        }

        const payload = await performCanvasSync(session, job.requestBody || {});
        setCanvasSnapshot(session, payload.lmsState);
        persistSession(sessionRecord);

        completeSyncJob(runningJob, {
          status: 'completed',
          source: payload.source,
          summary: summarizeSyncPayload(payload),
        });
      } catch (error) {
        updateCanvasOauth(session, {
          status: 'error',
          lastError: error.message,
        });
        persistSession(sessionRecord);
        completeSyncJob(runningJob, {
          status: 'failed',
          error: error.message,
        });
      }
    }
  } finally {
    isProcessingQueuedSyncJobs = false;
  }
}

function recoverQueuedSyncJobs() {
  const pendingJobs = stateStore
    .listJobs({ connectorId: 'canvas', limit: 200 })
    .filter((job) => ['queued', 'running'].includes(job.status));

  for (const job of pendingJobs) {
    stateStore.updateJob(job.id, {
      status: 'queued',
      startedAt: null,
      finishedAt: null,
      summary: 'Recovered after local API restart.',
      error: '',
    });
    enqueueSyncJob(job.id);
  }
}

recoverQueuedSyncJobs();

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': APP_ORIGIN,
      'Access-Control-Allow-Headers': 'Content-Type, x-mutelearn-session',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    response.end();
    return;
  }

  const url = new URL(request.url || '/', `http://${request.headers.host}`);
  const sessionRecord = getSessionRecord(request);
  const session = sessionRecord.session;

  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, {
      status: 'ok',
      serverTime: new Date().toISOString(),
      authMode: 'dev-session',
      connectorReadiness: {
        canvas: {
          oauthConfigured: isCanvasOauthConfigured(),
          redirectUri: CANVAS_REDIRECT_URI,
          baseUrl: CANVAS_BASE_URL || null,
        },
      },
      stateStore: {
        mode: 'file-backed',
        statePath: stateStore.getStatePath(),
      },
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/dev-login') {
    const body = await readBody(request);
    const token = randomUUID();
    const nextSession = {
      id: `session-${randomUUID()}`,
      issuedAt: new Date().toISOString(),
      user: {
        id: `user-${randomUUID()}`,
        name: body.name || 'Learner',
        email: body.email || 'learner@mutelearn.local',
        role: body.role || 'student',
        gradeLevel: body.gradeLevel || 'high-school',
      },
      connectors: {
        canvas: {
          status: 'disconnected',
          lastSyncedAt: null,
          connectionMode: isCanvasOauthConfigured() ? 'oauth-ready' : 'demo',
          lastSyncSource: null,
          courseCount: 0,
        },
      },
      oauth: {
        canvas: {
          status: 'disconnected',
        },
      },
      lmsSnapshots: {
        canvas: null,
      },
    };

    stateStore.setSession(token, nextSession);
    sendJson(response, 200, {
      sessionToken: token,
      session: serializeSession(nextSession),
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/auth/session') {
    sendJson(response, 200, {
      authenticated: Boolean(session),
      session: serializeSession(session),
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
    const token = getSessionToken(request);
    if (token) {
      stateStore.deleteSession(token);
    }
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/connectors') {
    sendJson(response, 200, {
      connectors: [canvasConnectorDescriptor(session)],
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/jobs') {
    sendJson(response, 200, {
      jobs: listSessionJobs(session, url.searchParams.get('connectorId') || undefined),
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/connectors/canvas/config') {
    sendJson(response, 200, {
      connector: 'canvas',
      oauthConfigured: isCanvasOauthConfigured(),
      baseUrl: CANVAS_BASE_URL || null,
      redirectUri: CANVAS_REDIRECT_URI,
      authReady: isCanvasOauthConfigured(),
      authorizationStatus: session?.oauth?.canvas?.status || 'disconnected',
      accountName: session?.oauth?.canvas?.accountName || null,
      hasToken: Boolean(session?.oauth?.canvas?.accessToken),
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/connectors/canvas/state') {
    sendJson(response, 200, {
      connector: 'canvas',
      lmsState: getCanvasSnapshot(session),
      latestJob: listSessionJobs(session, 'canvas', 1)[0] || null,
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/connectors/canvas/sync') {
    const body = await readBody(request);
    const syncJob = createSyncJob(session, 'canvas', session?.oauth?.canvas?.accessToken ? 'canvas-live' : 'server-demo');

    if (session && session.oauth?.canvas?.status === 'error') {
      updateCanvasOauth(session, {
        status: 'authorized',
        lastError: '',
      });
      persistSession(sessionRecord);
    }

    try {
      const payload = await performCanvasSync(session, body);
      if (session) {
        setCanvasSnapshot(session, payload.lmsState);
        persistSession(sessionRecord);
      }
      const completedJob = completeSyncJob(syncJob, {
        status: 'completed',
        source: payload.source,
        summary: summarizeSyncPayload(payload),
      });
      sendJson(response, 200, {
        ...payload,
        connector: canvasConnectorDescriptor(session),
        job: completedJob ? serializeJob(completedJob) : null,
      });
    } catch (error) {
      if (session) {
        updateCanvasOauth(session, {
          status: 'error',
          lastError: error.message,
        });
        persistSession(sessionRecord);
      }
      const failedJob = completeSyncJob(syncJob, {
        status: 'failed',
        error: error.message,
      });
      sendJson(response, 502, {
        error: error.message,
        connector: canvasConnectorDescriptor(session),
        job: failedJob ? serializeJob(failedJob) : null,
      });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/connectors/canvas/sync-jobs') {
    const body = await readBody(request);

    if (!session) {
      sendJson(response, 401, {
        error: 'A dev session is required before queueing a Canvas sync.',
      });
      return;
    }

    const job = createQueuedCanvasSyncJob(session, body);
    sendJson(response, 202, {
      job: job ? serializeJob(job) : null,
      connector: canvasConnectorDescriptor(session),
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/connectors/canvas/demo-sync') {
    const body = await readBody(request);
    const lmsState = createDemoState(body, session);
    const syncJob = createSyncJob(session, 'canvas', 'server-demo');

    if (session) {
      updateCanvasConnector(session, {
        status: 'connected',
        connectionMode: 'demo',
        lastSyncedAt: lmsState.connectors.canvas.lastSyncedAt,
        lastSyncSource: 'server-demo',
        courseCount: lmsState.courses.length,
      });
      setCanvasSnapshot(session, lmsState);
      persistSession(sessionRecord);
    }

    const completedJob = completeSyncJob(syncJob, {
      status: 'completed',
      source: 'server-demo',
      summary: `${lmsState.courses.length} courses, ${lmsState.assignments.length} assignments, ${lmsState.studyPacks.length} study packs`,
    });

    sendJson(response, 200, {
      source: 'server-demo',
      lmsState,
      connector: canvasConnectorDescriptor(session),
      job: completedJob ? serializeJob(completedJob) : null,
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/connectors/canvas/disconnect') {
    if (session) {
      updateCanvasConnector(session, {
        status: 'disconnected',
        connectionMode: isCanvasOauthConfigured() ? 'oauth-ready' : 'demo',
        lastSyncedAt: null,
        lastSyncSource: null,
        courseCount: 0,
      });
      updateCanvasOauth(session, {
        status: 'disconnected',
        accessToken: '',
        refreshToken: '',
        expiresAt: null,
        accountName: null,
        canvasUserId: null,
        lastError: '',
      });
      setCanvasSnapshot(session, null);
      persistSession(sessionRecord);
    }

    sendJson(response, 200, {
      ok: true,
      connector: canvasConnectorDescriptor(session),
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/connectors/canvas/oauth/start') {
    if (!session) {
      sendJson(response, 401, { error: 'A dev session is required before starting Canvas auth.' });
      return;
    }

    if (!isCanvasOauthConfigured()) {
      sendJson(response, 400, {
        error:
          'Canvas OAuth is not configured yet. Add CANVAS_BASE_URL, CANVAS_CLIENT_ID, and CANVAS_CLIENT_SECRET.',
      });
      return;
    }

    const state = randomUUID();
    stateStore.setOauthState(state, session.id);
    updateCanvasOauth(session, {
      state,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      lastError: '',
    });
    persistSession(sessionRecord);

    sendJson(response, 200, {
      connector: 'canvas',
      authorizationUrl: buildCanvasAuthorizationUrl(state),
      redirectUri: CANVAS_REDIRECT_URI,
      state,
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/connectors/canvas/oauth/callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const sessionId = state ? stateStore.consumeOauthState(state) : null;
    const sessionMatch = sessionId ? findSessionById(sessionId) : null;

    if (!sessionMatch?.session) {
      sendHtml(
        response,
        400,
        buildCallbackHtml({
          title: 'Canvas callback could not be matched',
          message: 'MuteLearn could not match this OAuth callback to an active local session.',
          detail: 'Start the Canvas connection again from the app so the local state can be recreated.',
          success: false,
        })
      );
      return;
    }

    const matchedSession = sessionMatch.session;
    const matchedSessionRecord = sessionMatch;

    if (error) {
      updateCanvasOauth(matchedSession, {
        status: 'error',
        lastError: error,
      });
      persistSession(matchedSessionRecord);
      sendHtml(
        response,
        400,
        buildCallbackHtml({
          title: 'Canvas connection was not completed',
          message: `Canvas returned an OAuth error: ${error}.`,
          detail: 'You can return to MuteLearn and try the connection again.',
          success: false,
        })
      );
      return;
    }

    if (!code) {
      updateCanvasOauth(matchedSession, {
        status: 'error',
        lastError: 'Canvas did not return an authorization code.',
      });
      persistSession(matchedSessionRecord);
      sendHtml(
        response,
        400,
        buildCallbackHtml({
          title: 'Canvas did not return a code',
          message: 'The OAuth callback arrived without an authorization code.',
          detail: 'Check the Canvas developer key redirect URI and try again.',
          success: false,
        })
      );
      return;
    }

    try {
      const tokenPayload = await exchangeCanvasToken({
        grantType: 'authorization_code',
        code,
      });

      updateCanvasOauth(
        matchedSession,
        buildCanvasTokenState(matchedSession.oauth?.canvas || {}, tokenPayload)
      );

      const profile = await fetchCanvasProfile(matchedSession).catch(() => null);
      updateCanvasOauth(matchedSession, {
        accountName: profile?.name || profile?.primary_email || 'Canvas account',
        canvasUserId: profile?.id || null,
        status: 'authorized',
        lastError: '',
      });

      updateCanvasConnector(matchedSession, {
        status: 'authorized',
        connectionMode: 'live',
        lastSyncedAt: null,
        lastSyncSource: null,
      });
      persistSession(matchedSessionRecord);

      sendHtml(
        response,
        200,
        buildCallbackHtml({
          title: 'Canvas account connected',
          message: 'MuteLearn finished the OAuth handshake and is ready for a live Canvas sync.',
          detail: 'Return to the app and run Sync Canvas to pull courses, assignments, files, and grades.',
          success: true,
        })
      );
    } catch (callbackError) {
      updateCanvasOauth(matchedSession, {
        status: 'error',
        lastError: callbackError.message,
      });
      persistSession(matchedSessionRecord);
      sendHtml(
        response,
        500,
        buildCallbackHtml({
          title: 'Canvas token exchange failed',
          message: callbackError.message,
          detail: 'Double-check the Canvas base URL, client ID, client secret, and redirect URI.',
          success: false,
        })
      );
    }
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`MuteLearn API server listening on http://localhost:${PORT}`);
});
