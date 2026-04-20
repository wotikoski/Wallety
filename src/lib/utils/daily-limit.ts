import { getDaysInMonth, getDate } from "date-fns";

export interface DailyLimitResult {
  actualIncome: number;
  actualFixedExpenses: number;
  spentVariable: number;
  remaining: number;
  remainingReal: number;
  daysInMonth: number;
  daysRemaining: number;
  dailyLimit: number;
  // Next month projection
  nextMonthIncome: number;
  nextMonthExpenses: number;
  nextMonthDeficit: number;
  // Final adjusted limit (after reserving for next month)
  reserveNeeded: number;
  adjustedAvailable: number;
  adjustedDailyLimit: number;
}

export function calculateDailyLimit(
  actualIncome: number,
  actualFixedExpenses: number,
  spentVariable: number,
  nextMonthIncome: number,
  nextMonthExpenses: number,
  referenceDate: Date = new Date(),
): DailyLimitResult {
  const daysInMonth = getDaysInMonth(referenceDate);
  const dayOfMonth = getDate(referenceDate);
  const daysRemaining = Math.max(1, daysInMonth - dayOfMonth + 1);

  const remaining = actualIncome - actualFixedExpenses;
  const remainingReal = remaining - spentVariable;
  const dailyLimit = daysInMonth > 0 ? remaining / daysInMonth : 0;

  const nextMonthDeficit = Math.max(0, nextMonthExpenses - nextMonthIncome);
  const reserveNeeded = nextMonthDeficit;
  const adjustedAvailable = Math.max(0, remainingReal - reserveNeeded);
  const adjustedDailyLimit = adjustedAvailable / daysRemaining;

  return {
    actualIncome,
    actualFixedExpenses,
    spentVariable,
    remaining,
    remainingReal,
    daysInMonth,
    daysRemaining,
    dailyLimit: Math.max(0, dailyLimit),
    nextMonthIncome,
    nextMonthExpenses,
    nextMonthDeficit,
    reserveNeeded,
    adjustedAvailable,
    adjustedDailyLimit: Math.max(0, adjustedDailyLimit),
  };
}
