import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";

export type DateRangeKey = "this_week" | "last_week" | "this_month" | "last_month" | "custom";

export function chf(value: number) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(value || 0);
}

export function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function todayIso() {
  return format(new Date(), "yyyy-MM-dd");
}

export function rangeFromKey(key: DateRangeKey, customStart?: string, customEnd?: string) {
  const now = new Date();
  const weekOptions = { weekStartsOn: 1 as const };
  if (key === "this_week") return { start: format(startOfWeek(now, weekOptions), "yyyy-MM-dd"), end: format(endOfWeek(now, weekOptions), "yyyy-MM-dd") };
  if (key === "last_week") {
    const d = subWeeks(now, 1);
    return { start: format(startOfWeek(d, weekOptions), "yyyy-MM-dd"), end: format(endOfWeek(d, weekOptions), "yyyy-MM-dd") };
  }
  if (key === "this_month") return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
  if (key === "last_month") {
    const d = subMonths(now, 1);
    return { start: format(startOfMonth(d), "yyyy-MM-dd"), end: format(endOfMonth(d), "yyyy-MM-dd") };
  }
  return { start: customStart || format(startOfWeek(now, weekOptions), "yyyy-MM-dd"), end: customEnd || todayIso() };
}
