import { addMonths, format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

export interface InstallmentData {
  installmentGroupId: string;
  date: string;
  installmentCurrent: number;
  installmentTotal: number;
  installmentValue: string;
  value: string;
}

export function generateInstallments(
  startDate: string,
  totalValue: number,
  totalInstallments: number,
): InstallmentData[] {
  const groupId = uuidv4();
  const baseInstallmentValue = Math.floor((totalValue / totalInstallments) * 100) / 100;
  const remainder = Math.round((totalValue - baseInstallmentValue * totalInstallments) * 100) / 100;

  const start = new Date(startDate + "T12:00:00");

  return Array.from({ length: totalInstallments }, (_, i) => {
    const installmentDate = addMonths(start, i);
    const isLast = i === totalInstallments - 1;
    const installmentValue = isLast
      ? baseInstallmentValue + remainder
      : baseInstallmentValue;

    return {
      installmentGroupId: groupId,
      date: format(installmentDate, "yyyy-MM-dd"),
      installmentCurrent: i + 1,
      installmentTotal: totalInstallments,
      installmentValue: installmentValue.toFixed(2),
      value: installmentValue.toFixed(2),
    };
  });
}
