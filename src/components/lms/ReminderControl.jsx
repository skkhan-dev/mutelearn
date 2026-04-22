import { useEffect, useRef, useState } from 'react';
import { useLMS } from '../../contexts/LMSContext';
import { formatDateOnly } from '../../lib/dateUtils';

const PRESETS = [
  { label: 'In 1 day', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'In 7 days', days: 7 },
];

// Small, self-contained control: a 🔔 button that opens a menu with preset
// and custom date options, plus a pill showing the active reminder if set.
// Clicking the pill clears the reminder.
export default function ReminderControl({ assignment, compact = false }) {
  const { setAssignmentReminder, setAssignmentReminderAt, clearAssignmentReminder } = useLMS();
  const [open, setOpen] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handlePreset = (days) => {
    setAssignmentReminder(assignment.id, days);
    setOpen(false);
  };

  const handleCustom = (event) => {
    event.preventDefault();
    if (!customDate) return;
    // Date input gives YYYY-MM-DD in local time — schedule at 9am local.
    const date = new Date(`${customDate}T09:00:00`);
    if (Number.isNaN(date.getTime())) return;
    setAssignmentReminderAt(assignment.id, date.toISOString());
    setCustomDate('');
    setOpen(false);
  };

  const reminderAt = assignment.reminderAt;
  const reminderDate = reminderAt ? new Date(reminderAt) : null;
  const reminderDue = reminderDate && reminderDate.getTime() <= Date.now();

  if (reminderAt) {
    return (
      <button
        onClick={() => clearAssignmentReminder(assignment.id)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
          reminderDue
            ? 'border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200'
            : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
        }`}
        title={`Reminder set for ${formatDateOnly(reminderAt)} — click to clear`}
      >
        <span>🔔</span>
        <span>{reminderDue ? 'Reminder due' : `Remind ${formatDateOnly(reminderAt)}`}</span>
      </button>
    );
  }

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-sky-200 text-sky-700 hover:bg-sky-50 transition-colors ${
          compact ? 'px-2.5 py-1 text-xs font-semibold' : 'px-4 py-2'
        }`}
        title="Set a reminder for this assignment"
      >
        <span>🔔</span>
        <span>Remind me</span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          {PRESETS.map((preset) => (
            <button
              key={preset.days}
              onClick={() => handlePreset(preset.days)}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-sky-50"
            >
              {preset.label}
            </button>
          ))}
          <form onSubmit={handleCustom} className="mt-1 border-t border-gray-100 pt-2">
            <label className="block px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Custom date
            </label>
            <div className="mt-1 flex gap-2 px-2 pb-1">
              <input
                type="date"
                value={customDate}
                onChange={(event) => setCustomDate(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
              <button
                type="submit"
                disabled={!customDate}
                className="rounded-md bg-sky-500 px-3 py-1 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
              >
                Set
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
