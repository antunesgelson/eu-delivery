import { z } from "zod";
export const enderecoSchema = z.object({
  apelido: z.string().trim().min(1, 'Informe um apelido.').max(100),
  rua: z.string().trim().min(1, 'Informe a rua.').max(200),
  bairro: z.string().trim().min(1, 'Informe o bairro.').max(200),
  cep: z.string().transform(v => v.replace(/\D/g, '')).pipe(z.string().length(8, 'Informe os 8 dígitos do CEP.')),
  numero: z.string().trim().min(1, 'Informe o número.').max(30),
  complemento: z.string().max(200).optional(),
  referencia: z.string().max(200).optional(),
});
