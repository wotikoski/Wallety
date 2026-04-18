import { z } from "zod";

export const groupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional().nullable(),
});

export const inviteSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export type GroupInput = z.infer<typeof groupSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
