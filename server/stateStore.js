import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const STATE_PATH = path.join(DATA_DIR, 'local-state.json');
const DEFAULT_STATE = {
  sessions: {},
  oauthStates: {},
  jobs: [],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureDataFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(STATE_PATH)) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(DEFAULT_STATE, null, 2));
  }
}

function loadState() {
  ensureDataFile();

  try {
    const raw = fs.readFileSync(STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      sessions: parsed.sessions || {},
      oauthStates: parsed.oauthStates || {},
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
    };
  } catch {
    fs.writeFileSync(STATE_PATH, JSON.stringify(DEFAULT_STATE, null, 2));
    return clone(DEFAULT_STATE);
  }
}

export function createPersistentStateStore() {
  const state = loadState();

  function persist() {
    ensureDataFile();
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  }

  return {
    getStatePath() {
      return STATE_PATH;
    },

    getSession(token) {
      return token ? state.sessions[token] || null : null;
    },

    setSession(token, session) {
      state.sessions[token] = session;
      persist();
      return session;
    },

    deleteSession(token) {
      const session = state.sessions[token] || null;
      delete state.sessions[token];

      if (session?.id) {
        for (const [oauthState, sessionId] of Object.entries(state.oauthStates)) {
          if (sessionId === session.id) {
            delete state.oauthStates[oauthState];
          }
        }

        state.jobs = state.jobs.filter((job) => job.sessionId !== session.id);
      }

      persist();
      return session;
    },

    findSessionById(sessionId) {
      for (const [token, session] of Object.entries(state.sessions)) {
        if (session.id === sessionId) {
          return { token, session };
        }
      }

      return null;
    },

    setOauthState(stateKey, sessionId) {
      state.oauthStates[stateKey] = sessionId;
      persist();
      return stateKey;
    },

    consumeOauthState(stateKey) {
      const sessionId = state.oauthStates[stateKey] || null;
      if (stateKey) {
        delete state.oauthStates[stateKey];
        persist();
      }
      return sessionId;
    },

    createJob(job) {
      state.jobs = [job, ...state.jobs].slice(0, 200);
      persist();
      return job;
    },

    getJob(jobId) {
      return state.jobs.find((job) => job.id === jobId) || null;
    },

    updateJob(jobId, patch) {
      const index = state.jobs.findIndex((job) => job.id === jobId);
      if (index === -1) return null;

      state.jobs[index] = {
        ...state.jobs[index],
        ...patch,
      };
      persist();
      return state.jobs[index];
    },

    listJobs({ sessionId, connectorId, limit = 12 } = {}) {
      return state.jobs
        .filter((job) => {
          if (sessionId && job.sessionId !== sessionId) return false;
          if (connectorId && job.connectorId !== connectorId) return false;
          return true;
        })
        .sort(
          (left, right) =>
            new Date(right.startedAt || right.queuedAt || 0) -
            new Date(left.startedAt || left.queuedAt || 0)
        )
        .slice(0, limit);
    },
  };
}
