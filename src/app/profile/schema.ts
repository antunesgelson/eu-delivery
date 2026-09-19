import { z } from "zod";

import { cpfValido, nascimentoValido } from "@/utils/validacaoCliente";

export const ProfileSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe seu nome.")
    .max(150, "Use até 150 caracteres."),
  telefone: z.string(),
  email: z
    .string()
    .trim()
    .pipe(
      z
        .string()
        .email("Informe um e-mail válido.")
        .max(255, "Use até 255 caracteres.")
        .or(z.literal("")),
    ),
  aniversario: z
    .string()
    .refine(
      nascimentoValido,
      "Informe uma data de nascimento válida, sem data futura.",
    ),
  cpf: z.string().refine(cpfValido, "Informe um CPF válido."),
});
export type ProfileForm = z.infer<typeof ProfileSchema>;
