// Small date helpers shared across SRS / today logic.

export function now(): Date {
  return new Date();
}

export function todayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isDue(dueIso: string, ref: Date = new Date()): boolean {
  return new Date(dueIso).getTime() <= ref.getTime();
}

export function daysOverdue(dueIso: string, ref: Date = new Date()): number {
  const diff = ref.getTime() - new Date(dueIso).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function formatRelativeDue(dueIso: string, ref: Date = new Date()): string {
  const due = new Date(dueIso).getTime();
  const diffMs = due - ref.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffMs <= 0) return 'due now';
  if (diffDays <= 0) return 'due today';
  if (diffDays === 1) return 'due tomorrow';
  return `due in ${diffDays} days`;
}
