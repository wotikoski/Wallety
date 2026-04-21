import { addMonths, endOfMonth, format, parseISO } from "date-fns";

/**
 * For a credit-card purchase made on `purchaseDate`, return the date the
 * invoice closes and the date it's due.
 *
 * Rules:
 *  - If the purchase day <= closingDay, it falls into the invoice that
 *    closes this month on `closingDay`. Otherwise, the next month's.
 *  - The due day is `dueDay` of the month after (or equal, if dueDay > closingDay)
 *    the closing month. We pick the convention: due date is the first dueDay
 *    strictly after the closing date.
 *  - Days that don't exist in a given month (e.g. 31 in Feb) clamp to the
 *    last day of that month.
 */
export function computeInvoice(purchaseDate: string, closingDay: number, dueDay: number): { closingDate: string; dueDate: string } {
  const d = parseISO(purchaseDate);
  const refYear = d.getFullYear();
  const refMonth = d.getMonth();
  const refDay = d.getDate();

  const clampedClose = clampDay(refYear, refMonth, closingDay);

  // Closing month: this month if purchase happened on/before the closing day, else next month.
  const closingBase =
    refDay <= clampedClose
      ? new Date(refYear, refMonth, 1)
      : addMonths(new Date(refYear, refMonth, 1), 1);

  const closingDate = new Date(
    closingBase.getFullYear(),
    closingBase.getMonth(),
    clampDay(closingBase.getFullYear(), closingBase.getMonth(), closingDay),
  );

  // Due date: first occurrence of `dueDay` strictly after `closingDate`.
  // Start by candidate in closing month; if <= closingDate, advance one month.
  let dueBase = new Date(closingDate.getFullYear(), closingDate.getMonth(), 1);
  let dueDate = new Date(dueBase.getFullYear(), dueBase.getMonth(), clampDay(dueBase.getFullYear(), dueBase.getMonth(), dueDay));
  if (dueDate <= closingDate) {
    dueBase = addMonths(dueBase, 1);
    dueDate = new Date(dueBase.getFullYear(), dueBase.getMonth(), clampDay(dueBase.getFullYear(), dueBase.getMonth(), dueDay));
  }

  return {
    closingDate: format(closingDate, "yyyy-MM-dd"),
    dueDate: format(dueDate, "yyyy-MM-dd"),
  };
}

/** Compute just the effective (due) date, or null if the card is not a credit card or is missing days. */
export function computeEffectiveDate(
  purchaseDate: string,
  paymentMethod: { type?: string | null; closingDay?: number | null; dueDay?: number | null } | null | undefined,
): string | null {
  if (!paymentMethod) return null;
  if (paymentMethod.type !== "credit_card") return null;
  if (!paymentMethod.closingDay || !paymentMethod.dueDay) return null;
  return computeInvoice(purchaseDate, paymentMethod.closingDay, paymentMethod.dueDay).dueDate;
}

function clampDay(year: number, month: number, day: number): number {
  const last = endOfMonth(new Date(year, month, 1)).getDate();
  return Math.min(Math.max(1, day), last);
}
