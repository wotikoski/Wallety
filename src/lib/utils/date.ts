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
 * Browsers silently overflow invalid end-of-month days to the next month's
 * 1st (e.g. typing "31/04" in an <input type="date"> yields "2026-05-01").
 * This function detects that overflow and snaps back to the last valid day of
 * the intended month, using the start date as context.
 *
 * Rule: if the new end-date is the 1st of a month AND that month differs from
 * the start-date's month, assume overflow → return last day of the previous month.
 * In all other cases the value is returned unchanged.
 */
export function clampEndDate(endVal: string, startVal: string): string {
  if (!endVal) return endVal;
  const end = parseISO(endVal);
  if (!isValid(end)) return endVal;
  if (end.getDate() !== 1) return endVal; // not 1st → no overflow

  if (startVal) {
    const start = parseISO(startVal);
    if (
      isValid(start) &&
      end.getMonth() === start.getMonth() &&
      end.getFullYear() === start.getFullYear()
    ) {
      return endVal; // same month as start → day-1 is intentional
    }
  }

  // Snap to last day of the previous month (= day 0 of current month)
  const lastDay = new Date(end.getFullYear(), end.getMonth(), 0);
  return format(lastDay, "yyyy-MM-dd");
}
