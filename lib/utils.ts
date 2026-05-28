export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

export function getMon(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function todayStr(): string {
  return fmtDate(new Date());
}

export function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

export function weekDates(mon: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

export function weekRangeStr(mon: Date): string {
  const sun = addDays(mon, 6);
  return `${fmtDate(mon)} ~ ${fmtDate(sun)}`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
