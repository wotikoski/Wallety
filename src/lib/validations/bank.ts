import { z } from "zod";

export const bankSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  code: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  color: z.string().optional().nullable(),
  groupId: z.string().uuid().optional().nullable(),
});

export type BankInput = z.infer<typeof bankSchema>;
