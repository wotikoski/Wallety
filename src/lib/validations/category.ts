import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["income", "expense", "both"]),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  groupId: z.string().uuid().optional().nullable(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
