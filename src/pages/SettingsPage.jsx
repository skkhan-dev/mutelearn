import { useState } from 'react';
import { useMode } from '../contexts/ModeContext';
import { useUser } from '../contexts/UserContext';
import { useLMS } from '../contexts/LMSContext';
import { usePlatform } from '../contexts/PlatformContext';
import { modeDefaults } from '../config/modeDefaults';
import { formatDateTime } from '../lib/dateUtils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

function SettingSection({ title, description, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      {description && <p className="text-sm text-gray-500 mt-1 mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { mode, switchMode, modeConfig, updateModeConfig } = useMode();
  const { user, firebaseUser, updateUser, logout: authLogout } = useUser();
  const {
    connectors,
    isCanvasConnected,
    isSyncing,
    syncSource,
    syncError,
    activeSyncJobId,
    canvasCredentials,
    saveCanvasCredentials,
    clearCanvasCredentials,
    syncCanvas,
    connectCanvasDemo,
    disconnectConnector,
  } = useLMS();
  const {
    backendStatus,
    backendInfo,
    session,
    syncJobs,
    canvasConfig,
    canvasAuthLink,
    error: platformError,
    loginDev,
    logout,
    requestCanvasAuthLink,
    refreshHealth,
    refreshSession,
    refreshConnectors,
  } = usePlatform();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [gradeLevel, setGradeLevel] = useState(user.gradeLevel || '');

  // Canvas token connection
  const [canvasUrl, setCanvasUrl] = useState('');
  const [canvasToken, setCanvasToken] = useState('');
  const [canvasConnecting, setCanvasConnecting] = useState(false);
  const [canvasConnectError, setCanvasConnectError] = useState('');
  const [canvasAccountName, setCanvasAccountName] = useState('');
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  const handleCanvasTokenConnect = async () => {
    if (!canvasUrl.trim() || !canvasToken.trim()) return;
    setCanvasConnecting(true);
    setCanvasConnectError('');
    setCanvasAccountName('');

    const baseUrl = canvasUrl.trim().replace(/\/+$/, '');
    const fullUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

    try {
      // Validate by calling Canvas API via our proxy
      const res = await fetch('/api/canvas-proxy/users/self/profile', {
        headers: {
          'x-canvas-base-url': fullUrl,
          'x-canvas-token': canvasToken.trim(),
        },
      });
      if (!res.ok) throw new Error('Invalid Canvas URL or token. Check both values and try again.');
      const profile = await res.json();
      const accountName = profile.name || profile.login_id || 'Connected';
      setCanvasAccountName(accountName);

      // Save credentials so sync uses real Canvas data
      saveCanvasCredentials(fullUrl, canvasToken.trim(), accountName);

      // Save to Firestore for cross-device persistence
      if (firebaseUser) {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          canvas: {
            baseUrl: fullUrl,
            accountName,
            canvasUserId: String(profile.id || ''),
            connectedAt: new Date().toISOString(),
          },
        }, { merge: true });
      }

      // Trigger a real Canvas sync
      await syncCanvas();
    } catch (err) {
      setCanvasConnectError(err.message || 'Could not connect to Canvas');
    } finally {
      setCanvasConnecting(false);
    }
  };

  const handleCanvasDisconnect = async () => {
    clearCanvasCredentials();
    disconnectConnector('canvas');
    setCanvasAccountName('');
    setCanvasUrl('');
    setCanvasToken('');
    if (firebaseUser) {
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        canvas: null,
      }, { merge: true });
    }
  };

  const handleSaveProfile = () => {
    updateUser({ name: name.trim(), gradeLevel });
  };

  const handleExportData = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('mutelearn-')) {
        data[key] = JSON.parse(localStorage.getItem(key));
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mutelearn-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        Object.entries(data).forEach(([key, value]) => {
          if (key.startsWith('mutelearn-')) {
            localStorage.setItem(key, JSON.stringify(value));
          }
        });
        window.location.reload();
      } catch {
        alert('Invalid backup file. Please select a valid MuteLearn backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetAll = () => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key.startsWith('mutelearn-')) {
        localStorage.removeItem(key);
      }
    }
    window.location.reload();
  };

  const handleDevLogin = async () => {
    await loginDev({
      name: user.name || 'Learner',
      gradeLevel: user.gradeLevel || 'high-school',
    });
    await refreshConnectors();
  };

  const handleCanvasAuthStart = async () => {
    const payload = await requestCanvasAuthLink();
    if (payload?.authorizationUrl) {
      window.open(payload.authorizationUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCanvasSync = async () => {
    await syncCanvas();
    await Promise.all([refreshSession(), refreshConnectors()]);
  };

  const timerSettings = modeConfig?.timer || { focus: 25, shortBreak: 5, longBreak: 15 };
  const canvasConnector = connectors.find((connector) => connector.id === 'canvas');
  const canvasAuthStatus = session?.oauth?.canvas?.status || canvasConfig?.authorizationStatus;
  const hasLiveCanvasToken = Boolean(session?.oauth?.canvas?.accountName || canvasConfig?.hasToken);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 mt-1">Customize your MuteLearn experience</p>
      </div>

      {/* Mode Selector */}
      <SettingSection
        title="Study Mode"
        description="Choose a mode that fits your learning style"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(modeDefaults).map(([key, config]) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                mode === key
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl block mb-2">{config.icon}</span>
              <span className="font-bold text-gray-800 block text-sm">{config.label}</span>
              <span className="text-xs text-gray-500 block mt-1">{config.description}</span>
            </button>
          ))}
        </div>
      </SettingSection>

      {/* Account */}
      <SettingSection
        title="Account"
        description="Your sign-in and sync settings"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-gray-800">
                  {firebaseUser?.displayName || firebaseUser?.email || 'Signed in'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {firebaseUser?.email || ''}
                  {firebaseUser?.providerData?.[0]?.providerId === 'google.com' && ' (Google)'}
                  {firebaseUser?.providerData?.[0]?.providerId === 'password' && ' (Email link)'}
                </p>
              </div>
              <button
                onClick={authLogout}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </SettingSection>

      {/* Canvas Connection */}
      <SettingSection
        title="Canvas LMS"
        description="Connect your school's Canvas to pull courses, assignments, and grades into MuteLearn"
      >
        <div className="space-y-4">
          {canvasCredentials?.baseUrl || canvasAccountName || isCanvasConnected ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">Canvas connected</p>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      active
                    </span>
                  </div>
                  {(canvasAccountName || canvasCredentials?.accountName) && (
                    <p className="text-sm text-gray-500 mt-1">
                      Account: {canvasAccountName || canvasCredentials?.accountName}
                      {canvasCredentials?.baseUrl && ` (${canvasCredentials.baseUrl.replace('https://', '')})`}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleCanvasSync}
                    className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={handleCanvasDisconnect}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {canvasConnectError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {canvasConnectError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Canvas URL
                  </label>
                  <input
                    type="text"
                    value={canvasUrl}
                    onChange={(e) => setCanvasUrl(e.target.value)}
                    placeholder="yourschool.instructure.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Access Token
                  </label>
                  <input
                    type="password"
                    value={canvasToken}
                    onChange={(e) => setCanvasToken(e.target.value)}
                    placeholder="Paste your Canvas API token"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleCanvasTokenConnect}
                    disabled={canvasConnecting || !canvasUrl.trim() || !canvasToken.trim()}
                    className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
                  >
                    {canvasConnecting ? 'Connecting...' : 'Connect Canvas'}
                  </button>
                  <button
                    onClick={connectCanvasDemo}
                    className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Use Demo Data Instead
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={() => setShowTokenHelp(!showTokenHelp)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {showTokenHelp ? 'Hide instructions' : 'How do I get my Canvas token?'}
                </button>
                {showTokenHelp && (
                  <div className="mt-3 rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-gray-700 space-y-2">
                    <p className="font-semibold">To generate a Canvas Personal Access Token:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
                      <li>Log into Canvas at your school URL</li>
                      <li>Click <strong>Account</strong> (profile icon, top left) then <strong>Settings</strong></li>
                      <li>Scroll to <strong>Approved Integrations</strong></li>
                      <li>Click <strong>+ New Access Token</strong></li>
                      <li>Enter purpose: <strong>MuteLearn</strong></li>
                      <li>Click <strong>Generate Token</strong> and copy it</li>
                    </ol>
                    <p className="text-xs text-gray-500 mt-2">
                      The token is only shown once. You can revoke it anytime from Canvas Settings.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SettingSection>

      {backendStatus === 'online' && (
        <SettingSection
          title="Backend Session"
          description="Local API scaffolding for auth, connector status, and future production sync jobs."
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">API status</p>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                      online
                    </span>
                  </div>
                  {backendInfo && (
                    <p className="text-sm text-gray-500 mt-1">
                      Last seen {formatDateTime(backendInfo.serverTime)}
                    </p>
                  )}
                </div>
                <button
                  onClick={refreshHealth}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white transition-colors"
                >
                  Refresh API
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold text-gray-800">Dev session</p>
                  {session ? (
                    <p className="text-sm text-gray-500 mt-1">
                      Signed in as {session.user.name} ({session.user.gradeLevel})
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      No backend session yet. Demo login unlocks server-backed connector state.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {!session ? (
                    <button
                      onClick={handleDevLogin}
                      className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                    >
                      Create Dev Session
                    </button>
                  ) : (
                    <button
                      onClick={logout}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white transition-colors"
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SettingSection>
      )}

      <SettingSection
        title="LMS Integration"
        description="Manage course sync so MuteLearn can build planners, study packs, and deadline reminders."
      >
        <div className="space-y-4">
          {connectors.map((connector) => (
            <div
              key={connector.id}
              className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{connector.name}</h3>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        connector.status === 'connected'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {connector.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Capabilities: {connector.capabilities.join(', ')}
                  </p>
                  {canvasConfig && connector.id === 'canvas' && (
                    <p className="text-xs text-gray-400 mt-2">
                      OAuth ready: {canvasConfig.oauthConfigured ? 'yes' : 'not yet'}
                      {canvasConnector?.connectionMode && ` · Mode: ${canvasConnector.connectionMode}`}
                    </p>
                  )}
                  {connector.id === 'canvas' && canvasAuthStatus && (
                    <p className="text-xs text-gray-400 mt-1">
                      Auth status: {canvasAuthStatus}
                      {hasLiveCanvasToken && session?.oauth?.canvas?.accountName
                        ? ` · ${session.oauth.canvas.accountName}`
                        : ''}
                    </p>
                  )}
                  {session?.oauth?.canvas?.lastError && connector.id === 'canvas' && (
                    <p className="text-xs text-amber-700 mt-2">{session.oauth.canvas.lastError}</p>
                  )}
                  {canvasAuthLink && connector.id === 'canvas' && (
                    <a
                      href={canvasAuthLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs text-indigo-600 mt-2 break-all"
                    >
                      Latest auth URL
                    </a>
                  )}
                  {connector.lastSyncedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Last synced {formatDateTime(connector.lastSyncedAt)}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {connector.id === 'canvas' && canvasConfig?.oauthConfigured && session && (
                    <button
                      onClick={handleCanvasAuthStart}
                      className="px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      {canvasAuthStatus === 'authorized' || canvasAuthStatus === 'pending'
                        ? 'Reconnect Canvas'
                        : 'Connect Canvas'}
                    </button>
                  )}
                  {connector.id === 'canvas' && (isCanvasConnected || canvasAuthStatus === 'authorized') && (
                    <>
                      <button
                        onClick={handleCanvasSync}
                        className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                      >
                        {isSyncing ? 'Syncing…' : canvasConnector?.connectionMode === 'demo' ? 'Refresh Demo Data' : 'Sync Canvas'}
                      </button>
                      <button
                        onClick={() => disconnectConnector('canvas')}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white transition-colors"
                      >
                        Disconnect
                      </button>
                    </>
                  )}
                  {connector.id === 'canvas' && !isCanvasConnected && (
                    <button
                      onClick={connectCanvasDemo}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white transition-colors"
                    >
                      Use Demo Data
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {(syncError || syncSource) && (
            <p className="text-xs text-gray-400">
              Latest sync source: {syncSource || 'none'}
              {activeSyncJobId ? ` · Active job: ${activeSyncJobId.slice(0, 12)}` : ''}
              {syncError ? ` · Warning: ${syncError}` : ''}
            </p>
          )}
        </div>
      </SettingSection>

      {backendStatus === 'online' && (
        <SettingSection
          title="Recent Sync Activity"
          description="A lightweight activity log for connector runs so local backend work is easier to verify."
        >
          <div className="space-y-3">
            {syncJobs.length > 0 ? (
              syncJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {job.connectorId} sync · {job.source}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {job.startedAt
                          ? `Started ${formatDateTime(job.startedAt)}`
                          : `Queued ${formatDateTime(job.queuedAt)}`}
                        {job.finishedAt ? ` · Finished ${formatDateTime(job.finishedAt)}` : ''}
                      </p>
                      {job.summary && (
                        <p className="text-sm text-gray-600 mt-2">{job.summary}</p>
                      )}
                      {job.error && (
                        <p className="text-sm text-amber-700 mt-2">{job.error}</p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        job.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : job.status === 'failed'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                No connector jobs yet. Run a demo sync or a live Canvas sync to populate this log.
              </p>
            )}
          </div>
        </SettingSection>
      )}

      {/* User Profile */}
      <SettingSection
        title="Profile"
        description="Update your personal information"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 bg-white"
            >
              <option value="">Select...</option>
              <option value="middle-school">Middle School</option>
              <option value="high-school">High School</option>
              <option value="college">College</option>
            </select>
          </div>

          <button
            onClick={handleSaveProfile}
            className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
          >
            Save Profile
          </button>
        </div>
      </SettingSection>

      {/* Timer Customization */}
      <SettingSection
        title="Timer Settings"
        description="Customize your study and break durations"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Focus Time (min)
            </label>
            <input
              type="number"
              value={timerSettings.focus}
              onChange={(e) =>
                updateModeConfig({
                  timer: { ...timerSettings, focus: parseInt(e.target.value) || 25 },
                })
              }
              min={1}
              max={120}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Break (min)
            </label>
            <input
              type="number"
              value={timerSettings.shortBreak}
              onChange={(e) =>
                updateModeConfig({
                  timer: { ...timerSettings, shortBreak: parseInt(e.target.value) || 5 },
                })
              }
              min={1}
              max={30}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Long Break (min)
            </label>
            <input
              type="number"
              value={timerSettings.longBreak}
              onChange={(e) =>
                updateModeConfig({
                  timer: { ...timerSettings, longBreak: parseInt(e.target.value) || 15 },
                })
              }
              min={1}
              max={60}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          These settings override the defaults for your current mode ({modeDefaults[mode]?.label})
        </p>
      </SettingSection>

      {/* Data Management */}
      <SettingSection
        title="Data Management"
        description="Export, import, or reset your data"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportData}
              className="flex-1 py-3 px-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-medium hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
            >
              <span>📤</span>
              Export Data
            </button>
            <label className="flex-1 py-3 px-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-medium hover:bg-blue-100 transition-colors cursor-pointer flex items-center justify-center gap-2">
              <span>📥</span>
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>

          <div className="border-t border-gray-100 pt-4">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3 px-4 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium hover:bg-red-100 transition-colors"
              >
                Reset All Data
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 font-medium mb-2">
                  Are you sure? This will permanently delete all your data.
                </p>
                <p className="text-sm text-red-600 mb-4">
                  This includes all decks, notes, quizzes, progress, and settings. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetAll}
                    className="flex-1 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                  >
                    Yes, Reset Everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SettingSection>
    </div>
  );
}
