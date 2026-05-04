import { z } from "zod";

export const goalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  targetAmount: z.number().positive("Valor deve ser positivo"),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  savedAmount: z.number().min(0).optional().default(0),
  color: z.string().optional().default("#6366f1"),
  emoji: z.string().optional().default("🎯"),
  notes: z.string().optional().nullable(),
  groupId: z.string().uuid().optional().nullable(),
});

export const depositSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
});

export type GoalInput = z.infer<typeof goalSchema>;
