import { z } from "zod";
import { dataDaLoja } from "@/hook/useAgendamento";
export function decimal(value: string) {
  return Number(
    value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value,
  );
}
export const cupomSchema = z
  .object({
    nome: z
      .string()
      .regex(
        /^[A-Z0-9_-]{2,60}$/,
        "Use de 2 a 60 letras, números, hífen ou sublinhado.",
      ),
    descricao: z.string().trim().min(1, "Informe a descrição.").max(300),
    tipo: z.enum(["porcentagem", "valor_fixo"]),
    valor: z
      .string()
      .refine(
        (v) =>
          Number.isFinite(decimal(v)) &&
          decimal(v) > 0 &&
          decimal(v) <= 100000 &&
          Math.abs(decimal(v) * 100 - Math.round(decimal(v) * 100)) < 0.000001,
        "Informe um desconto válido com até duas casas decimais.",
      ),
    valorMinimoGasto: z
      .string()
      .refine(
        (v) =>
          Number.isFinite(decimal(v)) &&
          decimal(v) >= 0 &&
          decimal(v) <= 100000 &&
          Math.abs(decimal(v) * 100 - Math.round(decimal(v) * 100)) < 0.000001,
        "Informe um pedido mínimo válido com até duas casas decimais.",
      ),
    quantidade: z
      .string()
      .refine(
        (v) =>
          v.trim() !== "" &&
          Number.isInteger(Number(v)) &&
          Number(v) >= 0 &&
          Number(v) <= 1000000,
        "Informe uma quantidade inteira entre 0 e 1000000.",
      ),
    validade: z
      .string()
      .refine(
        (v) =>
          /^\d{4}-\d{2}-\d{2}$/.test(v) &&
          Number.isFinite(new Date(v).getTime()) &&
          new Date(v).toISOString().slice(0, 10) === v &&
          v >= dataDaLoja(),
        "Informe uma validade atual ou futura.",
      ),
    listaPublica: z.boolean(),
    unicoUso: z.boolean(),
    status: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.tipo === "porcentagem" && decimal(d.valor) > 99)
      ctx.addIssue({
        code: "custom",
        path: ["valor"],
        message: "O desconto percentual máximo é 99%.",
      });
  });
export type CouponFormState = z.infer<typeof cupomSchema>;
