import { z } from "zod";

export const transactionSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  type: z.enum(["income", "expense"], { required_error: "Tipo é obrigatório" }),
  categoryId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, "Descrição é obrigatória"),
  value: z.number().positive("Valor deve ser positivo"),
  paymentMethodId: z.string().uuid().optional().nullable(),
  bankId: z.string().uuid().optional().nullable(),
  installmentTotal: z.number().int().min(1).max(120).optional().nullable(),
  installmentValue: z.number().positive().optional().nullable(),
  isPaid: z.boolean().default(false),
  isFixed: z.boolean().default(false),
  groupId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateTransactionSchema = transactionSchema.partial().extend({
  scope: z.enum(["single", "this_and_future", "all"]).optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
