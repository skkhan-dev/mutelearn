async function fetchJson(path, { method = 'GET', body, sessionToken } = {}) {
  const headers = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (sessionToken) {
    headers['x-mutelearn-session'] = sessionToken;
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorMessage =
      typeof payload === 'string' ? payload : payload.error || payload.message || 'Request failed';
    throw new Error(errorMessage);
  }

  return payload;
}

export const apiClient = {
  getHealth() {
    return fetchJson('/api/health');
  },

  loginDev(body) {
    return fetchJson('/api/auth/dev-login', { method: 'POST', body });
  },

  getSession(sessionToken) {
    return fetchJson('/api/auth/session', { sessionToken });
  },

  logout(sessionToken) {
    return fetchJson('/api/auth/logout', { method: 'POST', sessionToken });
  },

  getConnectors(sessionToken) {
    return fetchJson('/api/connectors', { sessionToken });
  },

  getJobs(sessionToken, connectorId) {
    const search = new URLSearchParams();
    if (connectorId) {
      search.set('connectorId', connectorId);
    }

    const suffix = search.toString() ? `?${search.toString()}` : '';
    return fetchJson(`/api/jobs${suffix}`, { sessionToken });
  },

  getCanvasConfig(sessionToken) {
    return fetchJson('/api/connectors/canvas/config', { sessionToken });
  },

  getCanvasState(sessionToken) {
    return fetchJson('/api/connectors/canvas/state', { sessionToken });
  },

  syncCanvas({ sessionToken, body }) {
    return fetchJson('/api/connectors/canvas/sync', {
      method: 'POST',
      sessionToken,
      body,
    });
  },

  queueCanvasSync({ sessionToken, body }) {
    return fetchJson('/api/connectors/canvas/sync-jobs', {
      method: 'POST',
      sessionToken,
      body,
    });
  },

  syncCanvasDemo({ sessionToken, body }) {
    return fetchJson('/api/connectors/canvas/demo-sync', {
      method: 'POST',
      sessionToken,
      body,
    });
  },

  disconnectCanvas(sessionToken) {
    return fetchJson('/api/connectors/canvas/disconnect', {
      method: 'POST',
      sessionToken,
    });
  },

  createCanvasAuthLink(sessionToken) {
    return fetchJson('/api/connectors/canvas/oauth/start', {
      method: 'POST',
      sessionToken,
    });
  },
};
