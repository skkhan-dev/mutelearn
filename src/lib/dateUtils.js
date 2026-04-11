export function formatRelativeTime(dateInput, referenceTime = Date.now()) {
  if (!dateInput) return '';

  const targetTime = new Date(dateInput).getTime();
  const diff = referenceTime - targetTime;
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDateTime(dateInput, options = {}) {
  if (!dateInput) return '';

  return new Date(dateInput).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  });
}

export function formatDateOnly(dateInput, options = {}) {
  if (!dateInput) return '';

  return new Date(dateInput).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function daysUntil(dateInput, referenceDate = new Date()) {
  const dueDate = new Date(dateInput);
  const start = startOfDay(referenceDate).getTime();
  const due = startOfDay(dueDate).getTime();
  return Math.round((due - start) / 86400000);
}

export function hoursUntil(dateInput, referenceDate = new Date()) {
  const dueDate = new Date(dateInput).getTime();
  return Math.round((dueDate - referenceDate.getTime()) / 3600000);
}

export function isOverdue(dateInput, referenceDate = new Date()) {
  return new Date(dateInput).getTime() < referenceDate.getTime();
}

export function startOfDay(dateInput = new Date()) {
  const value = new Date(dateInput);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function sortByDate(items, key = 'dueAt') {
  return [...items].sort((a, b) => new Date(a[key]) - new Date(b[key]));
}

export function buildDueLabel(dateInput, optionsOrReferenceDate) {
  // Backwards-compatible: second arg can be a Date (legacy) or an options object.
  const isOptions =
    optionsOrReferenceDate != null &&
    typeof optionsOrReferenceDate === 'object' &&
    !(optionsOrReferenceDate instanceof Date);
  const status = isOptions ? optionsOrReferenceDate.status : undefined;
  const referenceDate = isOptions
    ? optionsOrReferenceDate.referenceDate || new Date()
    : optionsOrReferenceDate || new Date();

  // Completed/submitted assignments should never read as overdue.
  if (status === 'completed') return 'Completed';
  if (status === 'submitted') return 'Submitted';

  const dayDiff = daysUntil(dateInput, referenceDate);

  if (dayDiff < 0) return `Overdue by ${Math.abs(dayDiff)} day${Math.abs(dayDiff) === 1 ? '' : 's'}`;
  if (dayDiff === 0) return 'Due today';
  if (dayDiff === 1) return 'Due tomorrow';
  return `Due in ${dayDiff} days`;
}

export function addDays(dateInput, days, hour = 17, minute = 0) {
  const value = new Date(dateInput);
  value.setDate(value.getDate() + days);
  value.setHours(hour, minute, 0, 0);
  return value;
}
