import { z } from "zod";

export const categoryBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  amount: z.number().nonnegative(),
  groupId: z.string().uuid().optional().nullable(),
});

export type CategoryBudgetInput = z.infer<typeof categoryBudgetSchema>;
