import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  getDate,
  addMonths,
  isValid,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "-";
  return format(d, pattern, { locale: ptBR });
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMMM 'de' yyyy", { locale: ptBR });
}

export function getMonthRange(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getDaysRemainingInMonth(): number {
  const today = new Date();
  const total = getDaysInMonth(today);
  const current = getDate(today);
  return total - current + 1;
}

export function addMonthsToDate(date: Date | string, months: number): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return addMonths(d, months);
}

export function toISODateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDate(str: string): Date {
  return parseISO(str);
}

export { getDaysInMonth, getDate, ptBR };

/**
 * Browsers handle invalid end-of-month days in two ways:
 *   a) Overflow: "31/04" → value "2026-05-01" (Chrome)
 *   b) Invalid:  "31/04" → value ""          (some browsers/states)
 *
 * Case (a): if endVal is the 1st of a month different from startDate's month,
 *           assume day-overflow → snap to last valid day of the previous month.
 * Case (b): endVal is "" → return "" so the caller can decide to ignore it
 *           (keeping the previous valid state unchanged).
 *
 * In all other cases the value is returned unchanged.
 */
export function clampEndDate(endVal: string, startVal: string): string {
  if (!endVal) return ""; // caller should ignore empty → keep previous state
  const end = parseISO(endVal);
  if (!isValid(end)) return "";
  if (end.getDate() !== 1) return endVal; // not 1st of month → no overflow

  if (startVal) {
    const start = parseISO(startVal);
    if (
      isValid(start) &&
      end.getMonth() === start.getMonth() &&
      end.getFullYear() === start.getFullYear()
    ) {
      return endVal; // 1st of same month as start → intentional
    }
  }

  // Day-overflow detected: snap to last day of the previous month
  // new Date(year, month, 0) = day 0 of `month` = last day of month-1
  const lastDay = new Date(end.getFullYear(), end.getMonth(), 0);
  return format(lastDay, "yyyy-MM-dd");
}
