import { addDays, addMonths, addYears, endOfMonth, format, parseISO } from "date-fns";

type Frequency = "monthly" | "weekly" | "yearly";

/**
 * Returns the list of occurrence dates for a recurring rule between
 * (exclusive) `from` and (inclusive) `toInclusive`. If `from` is null,
 * starts from `startDate` inclusive.
 */
export function computeOccurrences(rule: {
  frequency: string;
  dayOfMonth: string | null;
  startDate: string;
  endDate: string | null;
  lastGeneratedDate: string | null;
}, toInclusive: Date): string[] {
  const freq = rule.frequency as Frequency;
  const start = parseISO(rule.startDate);
  const end = rule.endDate ? parseISO(rule.endDate) : null;
  const lastGen = rule.lastGeneratedDate ? parseISO(rule.lastGeneratedDate) : null;

  let cursor = lastGen ? step(lastGen, freq, rule.dayOfMonth) : alignToRule(start, freq, rule.dayOfMonth);

  const out: string[] = [];
  while (cursor <= toInclusive) {
    if (end && cursor > end) break;
    if (cursor >= start) out.push(format(cursor, "yyyy-MM-dd"));
    cursor = step(cursor, freq, rule.dayOfMonth);
  }
  return out;
}

function step(from: Date, freq: Frequency, dayOfMonth: string | null): Date {
  if (freq === "weekly") return addDays(from, 7);
  if (freq === "yearly") return addYears(from, 1);
  // monthly: advance one month, then re-anchor to requested day.
  const next = addMonths(from, 1);
  return alignToRule(next, "monthly", dayOfMonth);
}

function alignToRule(date: Date, freq: Frequency, dayOfMonth: string | null): Date {
  if (freq !== "monthly") return date;
  const year = date.getFullYear();
  const month = date.getMonth();
  if (dayOfMonth === "last") return endOfMonth(new Date(year, month, 1));
  const day = parseInt(dayOfMonth ?? String(date.getDate()));
  const lastDay = endOfMonth(new Date(year, month, 1)).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}
