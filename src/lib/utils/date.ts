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
