import { useState } from 'react';
import { useMode } from '../contexts/ModeContext';
import { useUser } from '../contexts/UserContext';
import { modeDefaults } from '../config/modeDefaults';

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
  const { user, updateUser } = useUser();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [gradeLevel, setGradeLevel] = useState(user.gradeLevel || '');

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

  const timerSettings = modeConfig?.timer || { focus: 25, shortBreak: 5, longBreak: 15 };

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
