"use client";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, mostrarErro } from "@/service/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
const schema = z.object({
  cashback: z.coerce.number().min(0).max(100),
  minimo: z.coerce.number().min(0),
  intervalo: z.coerce.number().int().min(10).max(120),
  telefone: z.string().max(30),
  taxa: z.coerce.number().min(0).max(100000),
  cep: z.string().regex(/^\d{8}$/, "Informe um CEP com 8 dígitos."),
  entrega: z.boolean(),
  endereco: z.string().min(2),
  horarios: z.string().min(2),
});
type FormData = z.infer<typeof schema>;
export default function ViewConfig() {
  const client = useQueryClient();
  const q = useQuery<any[]>({
    queryKey: ["configuracao"],
    queryFn: async () => (await api.get("/configuracao")).data,
  });
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  React.useEffect(() => {
    if (!q.data) return;
    const get = (k: string, f = "") =>
      q.data!.find((c) => c.chave === k)?.valor ?? f;
    const delivery = JSON.parse(get("ENTREGA", "{}"));
    form.reset({
      cashback: Number(get("CASHBACK", "3")),
      minimo: Number(get("PEDIDOMINIMO", "35")),
      intervalo: Number(get("INTERVALODEENTREGA", "30")),
      telefone: get("TELEFONE"),
      taxa: delivery.taxa ?? 10,
      cep: delivery.faixasCep?.[0]?.inicio ?? "88650000",
      entrega: delivery.habilitada ?? false,
      endereco: get(
        "ENDERECO",
        JSON.stringify({
          apelido: "Retirada na loja",
          rua: "Rua Hélio Laudelino da Silva",
          numero: "41",
          bairro: "Bom Viver - Biguaçu",
        }),
      ),
      horarios: get("HORARIOATENDIMENTO", "{}"),
    });
  }, [q.data, form]);
  const save = useMutation({
    mutationFn: async (d: FormData) => {
      JSON.parse(d.endereco);
      JSON.parse(d.horarios);
      const changes = {
        CASHBACK: String(d.cashback),
        PEDIDOMINIMO: String(d.minimo),
        INTERVALODEENTREGA: String(d.intervalo),
        TELEFONE: d.telefone,
        ENDERECO: d.endereco,
        HORARIOATENDIMENTO: d.horarios,
        ENTREGA: JSON.stringify({
          habilitada: d.entrega,
          taxa: d.taxa,
          bairros: [],
          faixasCep: [{ inicio: d.cep, fim: d.cep }],
        }),
      };
      for (const [chave, valor] of Object.entries(changes))
        await api.put("/configuracao", { chave, valor });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["configuracao"] });
      toast.success("Configurações salvas.");
    },
    onError: mostrarErro,
  });
  if (q.isPending) return <p>Carregando configurações…</p>;
  if (q.isError)
    return <Button onClick={() => q.refetch()}>Tentar novamente</Button>;
  return (
    <form
      className="mx-auto max-w-3xl space-y-4 rounded-md bg-white p-5 text-neutral-900"
      onSubmit={form.handleSubmit((d) => save.mutate(d))}
    >
      {(
        [
          ["cashback", "Cashback (%)"],
          ["minimo", "Pedido mínimo (R$)"],
          ["intervalo", "Intervalo dos horários (minutos)"],
          ["telefone", "Telefone da loja"],
          ["taxa", "Taxa fixa de entrega (R$)"],
          ["cep", "CEP atendido"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="block text-sm font-semibold">
          {label}
          <Input
            className="mt-1"
            type={["telefone", "cep"].includes(key) ? "text" : "number"}
            step="any"
            {...form.register(key)}
            error={form.formState.errors[key]?.message}
          />
        </label>
      ))}
      <label className="flex gap-2">
        <input type="checkbox" {...form.register("entrega")} />
        Habilitar entrega no CEP informado
      </label>
      <fieldset className="space-y-2 rounded border p-3">
        <legend className="font-semibold">Endereço de retirada</legend>
        {(["rua", "numero", "bairro"] as const).map((key) => {
          let value: any = {};
          try {
            value = JSON.parse(form.watch("endereco") || "{}");
          } catch {}
          return (
            <label key={key} className="block text-sm capitalize">
              {key}
              <Input
                value={value[key] ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "endereco",
                    JSON.stringify({ ...value, [key]: e.target.value }),
                  )
                }
              />
            </label>
          );
        })}
      </fieldset>
      <fieldset className="space-y-3 rounded border p-3">
        <legend className="font-semibold">Horários de atendimento</legend>
        {[
          ["sab", "Sábado"],
          ["dom", "Domingo"],
        ].map(([day, label]) => {
          let schedule: any = {};
          try {
            schedule = JSON.parse(form.watch("horarios") || "{}");
          } catch {}
          return (
            <div key={day}>
              <strong className="text-sm">{label}</strong>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["abertura", "Abertura"],
                  ["fechamento", "Fechamento"],
                ].map(([key, title]) => (
                  <label key={key} className="text-xs">
                    {title}
                    <Input
                      type="time"
                      value={schedule[day]?.[key] ?? ""}
                      onChange={(e) =>
                        form.setValue(
                          "horarios",
                          JSON.stringify({
                            ...schedule,
                            [day]: { ...schedule[day], [key]: e.target.value },
                          }),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </fieldset>
      <Button disabled={save.isPending}>Salvar configurações</Button>
    </form>
  );
}
