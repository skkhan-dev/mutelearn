import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { apiClient } from '../lib/apiClient';

const PlatformContext = createContext();

export function PlatformProvider({ children }) {
  const [sessionToken, setSessionToken] = useLocalStorage('mutelearn-session-token', '');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [backendInfo, setBackendInfo] = useState(null);
  const [session, setSession] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [syncJobs, setSyncJobs] = useState([]);
  const [canvasConfig, setCanvasConfig] = useState(null);
  const [canvasAuthLink, setCanvasAuthLink] = useState('');
  const [error, setError] = useState('');

  const refreshHealth = useCallback(async () => {
    try {
      const payload = await apiClient.getHealth();
      setBackendStatus('online');
      setBackendInfo(payload);
      setError('');
      return payload;
    } catch (healthError) {
      setBackendStatus('offline');
      setBackendInfo(null);
      setError(healthError.message);
      return null;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!sessionToken) {
      setSession(null);
      return null;
    }

    try {
      const payload = await apiClient.getSession(sessionToken);
      setSession(payload.session || null);
      setError('');
      return payload.session || null;
    } catch (sessionError) {
      setSession(null);
      setSessionToken('');
      setError(sessionError.message);
      return null;
    }
  }, [sessionToken, setSessionToken]);

  const refreshConnectors = useCallback(async () => {
    if (backendStatus !== 'online') {
      setConnectors([]);
      setCanvasConfig(null);
      return null;
    }

    try {
      const [connectorPayload, canvasPayload] = await Promise.all([
        apiClient.getConnectors(sessionToken || undefined),
        apiClient.getCanvasConfig(sessionToken || undefined),
      ]);
      setConnectors(connectorPayload.connectors || []);
      setCanvasConfig(canvasPayload);
      return connectorPayload;
    } catch (connectorError) {
      setError(connectorError.message);
      return null;
    }
  }, [backendStatus, sessionToken]);

  const refreshJobs = useCallback(async () => {
    if (backendStatus !== 'online' || !sessionToken) {
      setSyncJobs([]);
      return null;
    }

    try {
      const payload = await apiClient.getJobs(sessionToken, 'canvas');
      setSyncJobs(payload.jobs || []);
      return payload.jobs || [];
    } catch (jobsError) {
      setError(jobsError.message);
      return null;
    }
  }, [backendStatus, sessionToken]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void refreshHealth();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [refreshHealth]);

  useEffect(() => {
    if (backendStatus === 'online') {
      const timerId = window.setTimeout(() => {
        void refreshSession();
      }, 0);

      return () => window.clearTimeout(timerId);
    }

    return undefined;
  }, [backendStatus, refreshSession]);

  useEffect(() => {
    if (backendStatus === 'online') {
      const timerId = window.setTimeout(() => {
        void refreshConnectors();
      }, 0);

      return () => window.clearTimeout(timerId);
    }

    return undefined;
  }, [backendStatus, refreshConnectors]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      if (backendStatus === 'online' && sessionToken) {
        void refreshJobs();
      } else if (!sessionToken) {
        setSyncJobs([]);
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [backendStatus, refreshJobs, sessionToken]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type !== 'mutelearn-canvas-oauth-complete') {
        return;
      }

      window.setTimeout(() => {
        void refreshSession();
        void refreshConnectors();
        void refreshJobs();
      }, 0);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refreshConnectors, refreshJobs, refreshSession]);

  const loginDev = useCallback(
    async (userDetails = {}) => {
      const payload = await apiClient.loginDev(userDetails);
      setSessionToken(payload.sessionToken);
      setSession(payload.session || null);
      setError('');
      try {
        const [connectorPayload, canvasPayload] = await Promise.all([
          apiClient.getConnectors(payload.sessionToken),
          apiClient.getCanvasConfig(payload.sessionToken),
        ]);
        setConnectors(connectorPayload.connectors || []);
        setCanvasConfig(canvasPayload);
        const jobsPayload = await apiClient.getJobs(payload.sessionToken, 'canvas');
        setSyncJobs(jobsPayload.jobs || []);
      } catch {
        await refreshConnectors();
        await refreshJobs();
      }
      return payload;
    },
    [refreshConnectors, refreshJobs, setSessionToken]
  );

  const logout = useCallback(async () => {
    if (sessionToken && backendStatus === 'online') {
      try {
        await apiClient.logout(sessionToken);
      } catch {
        // Best effort local cleanup is enough here.
      }
    }

    setSessionToken('');
    setSession(null);
    setConnectors([]);
    setSyncJobs([]);
    setCanvasConfig(null);
    setCanvasAuthLink('');
  }, [backendStatus, sessionToken, setSessionToken]);

  const requestCanvasAuthLink = useCallback(async () => {
    if (!sessionToken) {
      throw new Error('Create a dev session before generating a Canvas auth URL.');
    }

    const payload = await apiClient.createCanvasAuthLink(sessionToken);
    setCanvasAuthLink(payload.authorizationUrl || '');
    return payload;
  }, [sessionToken]);

  const value = useMemo(
    () => ({
      backendStatus,
      backendInfo,
      sessionToken,
      session,
      connectors,
      syncJobs,
      canvasConfig,
      canvasAuthLink,
      error,
      isBackendOnline: backendStatus === 'online',
      loginDev,
      logout,
      requestCanvasAuthLink,
      refreshHealth,
      refreshSession,
      refreshConnectors,
      refreshJobs,
    }),
    [
      backendInfo,
      backendStatus,
      canvasAuthLink,
      canvasConfig,
      connectors,
      syncJobs,
      error,
      loginDev,
      logout,
      requestCanvasAuthLink,
      refreshConnectors,
      refreshJobs,
      refreshHealth,
      refreshSession,
      session,
      sessionToken,
    ]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within PlatformProvider');
  }
  return context;
}
