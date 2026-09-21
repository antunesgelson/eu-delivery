import { z } from "zod";
export const dias = [
  ["seg", "Segunda-feira"],
  ["ter", "Terça-feira"],
  ["qua", "Quarta-feira"],
  ["qui", "Quinta-feira"],
  ["sex", "Sexta-feira"],
  ["sab", "Sábado"],
  ["dom", "Domingo"],
] as const;
const hora = /^([01]\d|2[0-3]):[0-5]\d$/;
const dia = z
  .object({
    aberto: z.boolean(),
    abertura: z.string(),
    fechamento: z.string(),
    intervalo: z.boolean(),
    inicio: z.string(),
    fim: z.string(),
  })
  .superRefine((d, ctx) => {
    if (!d.aberto) return;
    for (const key of ["abertura", "fechamento"] as const)
      if (!hora.test(d[key]))
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Informe o horário.",
        });
    if (d.fechamento <= d.abertura)
      ctx.addIssue({
        code: "custom",
        path: ["fechamento"],
        message: "O fechamento deve ser após a abertura.",
      });
    if (d.intervalo) {
      for (const key of ["inicio", "fim"] as const)
        if (!hora.test(d[key]))
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: "Informe o horário do intervalo.",
          });
      if (d.inicio < d.abertura || d.fim > d.fechamento || d.inicio >= d.fim)
        ctx.addIssue({
          code: "custom",
          path: ["fim"],
          message:
            "O intervalo deve ficar dentro do atendimento, com fim após o início.",
        });
    }
  });
const social = z
  .string()
  .trim()
  .refine(
    (s) => !s || (/^https?:\/\//.test(s) && URL.canParse(s)),
    "Informe uma URL http ou https.",
  );
export const schema = z
  .object({
    cashback: z.coerce.number().min(0).max(100),
    minimo: z.coerce.number().min(0).max(100000),
    intervalo: z.coerce.number().int().min(10).max(120),
    telefone: z
      .string()
      .max(30)
      .refine(
        (s) => !s || /^\d{10,13}$/.test(s.replace(/\D/g, "")),
        "Informe um telefone com DDD.",
      ),
    taxa: z.coerce.number().min(0).max(100000),
    entrega: z.boolean(),
    ceps: z
      .array(
        z
          .object({
            inicio: z.string().regex(/^\d{8}$/, "Informe 8 dígitos."),
            fim: z.string().regex(/^\d{8}$/, "Informe 8 dígitos."),
          })
          .refine((v) => v.inicio <= v.fim, {
            path: ["fim"],
            message: "O CEP final deve ser igual ou maior que o inicial.",
          }),
      )
      .max(50),
    bairros: z
      .string()
      .refine(
        (s) => s.split("\n").every((v) => v.trim().length <= 150),
        "Use até 150 caracteres por bairro.",
      ),
    rua: z.string().trim().min(1, "Informe a rua.").max(200),
    numero: z.string().trim().min(1, "Informe o número.").max(30),
    bairro: z.string().trim().min(1, "Informe o bairro.").max(200),
    complemento: z.string().trim().max(200),
    referencia: z.string().trim().max(200),
    instagram: social,
    facebook: social,
    dias: z.array(dia).length(7),
  })
  .superRefine((d, ctx) => {
    if (d.entrega && !d.ceps.length && !d.bairros.trim())
      ctx.addIssue({
        code: "custom",
        path: ["bairros"],
        message: "Informe uma faixa de CEP ou bairro atendido.",
      });
  });
export type FormData = z.infer<typeof schema>;
export type Configuracao = { chave: string; valor: string };
function objeto<T>(value: string | undefined, fallback: T): T {
  return value ? (JSON.parse(value) as T) : fallback;
}
export function dadosDoFormulario(config: Configuracao[]): FormData {
  const get = (key: string, fallback = "") =>
    config.find((c) => c.chave === key)?.valor ?? fallback;
  const endereco = objeto<Record<string, string>>(get("ENDERECO"), {
    rua: "Rua Hélio Laudelino da Silva",
    numero: "41",
    bairro: "Bom Viver - Biguaçu",
  });
  const redes = objeto<Record<string, string>>(get("REDESSOCIAIS"), {});
  const entrega = objeto<{
    habilitada: boolean;
    taxa: number;
    bairros: string[];
    faixasCep: FormData["ceps"];
  }>(get("ENTREGA"), {
    habilitada: false,
    taxa: 10,
    bairros: [],
    faixasCep: [{ inicio: "88650000", fim: "88650000" }],
  });
  const horarios = objeto<Record<string, Record<string, string>>>(
    get("HORARIOATENDIMENTO"),
    {},
  );
  return {
    cashback: Number(get("CASHBACK", "3")),
    minimo: Number(get("PEDIDOMINIMO", "35")),
    intervalo: Number(get("INTERVALODEENTREGA", "30")),
    telefone: get("TELEFONE"),
    entrega: entrega.habilitada,
    taxa: entrega.taxa,
    ceps: entrega.faixasCep,
    bairros: entrega.bairros.join("\n"),
    rua: endereco.rua ?? "",
    numero: endereco.numero ?? "",
    bairro: endereco.bairro ?? "",
    complemento: endereco.complemento ?? "",
    referencia: endereco.referencia ?? "",
    instagram: redes.instagram ?? "",
    facebook: redes.facebook ?? "",
    dias: dias.map(([key]) => {
      const h =
        horarios[key] ??
        (["sab", "dom"].includes(key)
          ? { abertura: "11:30", fechamento: "14:00" }
          : {});
      return {
        aberto: Boolean(h.abertura && h.fechamento),
        abertura: h.abertura ?? "",
        fechamento: h.fechamento ?? "",
        intervalo: Boolean(h.inicio_intervalo),
        inicio: h.inicio_intervalo ?? "",
        fim: h.fim_intervalo ?? "",
      };
    }),
  };
}
export function configuracoesDoFormulario(
  d: FormData,
  anteriores: Configuracao[],
): Configuracao[] {
  const endereco = objeto<Record<string, unknown>>(
    anteriores.find((c) => c.chave === "ENDERECO")?.valor,
    {},
  );
  const redes = objeto<Record<string, unknown>>(
    anteriores.find((c) => c.chave === "REDESSOCIAIS")?.valor,
    {},
  );
  const values = {
    CASHBACK: String(d.cashback),
    PEDIDOMINIMO: String(d.minimo),
    INTERVALODEENTREGA: String(d.intervalo),
    TELEFONE: d.telefone.replace(/\D/g, ""),
    ENDERECO: JSON.stringify({
      ...endereco,
      apelido: endereco.apelido || "Retirada na loja",
      rua: d.rua,
      numero: d.numero,
      bairro: d.bairro,
      complemento: d.complemento,
      referencia: d.referencia,
    }),
    REDESSOCIAIS: JSON.stringify({
      ...redes,
      instagram: d.instagram,
      facebook: d.facebook,
    }),
    ENTREGA: JSON.stringify({
      habilitada: d.entrega,
      taxa: d.taxa,
      bairros: d.bairros
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean),
      faixasCep: d.ceps,
    }),
    HORARIOATENDIMENTO: JSON.stringify(
      Object.fromEntries(
        dias.map(([key], i) => {
          const h = d.dias[i];
          return [
            key,
            {
              abertura: h.aberto ? h.abertura : "",
              fechamento: h.aberto ? h.fechamento : "",
              inicio_intervalo: h.aberto && h.intervalo ? h.inicio : "",
              fim_intervalo: h.aberto && h.intervalo ? h.fim : "",
            },
          ];
        }),
      ),
    ),
  };
  return Object.entries(values).map(([chave, valor]) => ({ chave, valor }));
}
