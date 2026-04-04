/** Short relative time for feed headers (e.g. `5h`, `2d`, `3w`). */
export function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diffMs = Date.now() - t;
  if (diffMs < 0) return 'now';
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  if (weeks >= 1) return `${weeks}w`;
  if (days >= 1) return `${days}d`;
  if (hours >= 1) return `${hours}h`;
  if (mins >= 1) return `${mins}m`;
  return 'now';
}
