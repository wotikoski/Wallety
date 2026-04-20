import { z } from "zod";

export const recurringTransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  value: z.number().positive("Valor deve ser positivo"),
  categoryId: z.string().uuid().optional().nullable(),
  paymentMethodId: z.string().uuid().optional().nullable(),
  bankId: z.string().uuid().optional().nullable(),
  frequency: z.enum(["monthly", "weekly", "yearly"]),
  dayOfMonth: z.string().optional().nullable(), // '1'-'31' or 'last'
  startDate: z.string().min(1, "Data inicial é obrigatória"),
  endDate: z.string().optional().nullable(),
  groupId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type RecurringTransactionInput = z.infer<typeof recurringTransactionSchema>;
