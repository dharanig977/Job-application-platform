// "Posted within" windows shown on the jobs tracker.
export const WINDOWS = [
  { key: "5m", label: "5 min", minutes: 5 },
  { key: "10m", label: "10 min", minutes: 10 },
  { key: "1h", label: "1 hour", minutes: 60 },
  { key: "14h", label: "14 hours", minutes: 60 * 14 },
  { key: "24h", label: "24 hours", minutes: 60 * 24 },
  { key: "7d", label: "Week", minutes: 60 * 24 * 7 },
  { key: "30d", label: "Month", minutes: 60 * 24 * 30 },
] as const;

export type WindowKey = (typeof WINDOWS)[number]["key"];

export function windowStart(key: string | undefined): Date | undefined {
  const w = WINDOWS.find((w) => w.key === key);
  return w ? new Date(Date.now() - w.minutes * 60_000) : undefined;
}

export function ago(date: Date): string {
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function duration(from: Date, to: Date): string {
  const mins = Math.round((to.getTime() - from.getTime()) / 60_000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h} h ${mins % 60} min`;
}

export function stamp(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}
