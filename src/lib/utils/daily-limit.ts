import { getDaysInMonth, getDate } from "date-fns";

export interface DailyLimitResult {
  plannedIncome: number;
  plannedFixedExpenses: number;
  remaining: number;
  daysInMonth: number;
  daysRemaining: number;
  dailyLimit: number;
  adjustedDailyLimit: number;
  spentVariable: number;
  remainingReal: number;
}

export function calculateDailyLimit(
  plannedIncome: number,
  plannedFixedExpenses: number,
  spentVariable: number,
  referenceDate: Date = new Date(),
): DailyLimitResult {
  const daysInMonth = getDaysInMonth(referenceDate);
  const dayOfMonth = getDate(referenceDate);
  const daysRemaining = daysInMonth - dayOfMonth + 1;

  const remaining = plannedIncome - plannedFixedExpenses;
  const dailyLimit = remaining / daysInMonth;

  const remainingReal = remaining - spentVariable;
  const adjustedDailyLimit = daysRemaining > 0 ? remainingReal / daysRemaining : 0;

  return {
    plannedIncome,
    plannedFixedExpenses,
    remaining,
    daysInMonth,
    daysRemaining,
    dailyLimit: Math.max(0, dailyLimit),
    adjustedDailyLimit: Math.max(0, adjustedDailyLimit),
    spentVariable,
    remainingReal,
  };
}
