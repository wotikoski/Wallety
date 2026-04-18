import { z } from "zod";

export const paymentMethodSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["bank_account", "cash", "pix", "credit_card", "debit_card", "other"]),
  bankId: z.string().uuid().optional().nullable(),
  groupId: z.string().uuid().optional().nullable(),
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
