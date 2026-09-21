"use client";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, mostrarErro } from "@/service/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  schema,
  dias,
  dadosDoFormulario,
  configuracoesDoFormulario,
  FormData,
  Configuracao,
} from "../schema";

export default function ViewConfig() {
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["configuracao"],
    queryFn: async ({ signal }) => {
      const configs: Configuracao[] = (
        await api.get("/configuracao", { signal })
      ).data;
      dadosDoFormulario(configs);
      return configs;
    },
    retry: false,
  });
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const ceps = useFieldArray({ control: form.control, name: "ceps" });
  const save = useMutation({
    mutationFn: async (d: FormData) => {
      const changes = configuracoesDoFormulario(d, q.data ?? []);
      await api.put("/admin/configuracoes", { configuracoes: changes });
      return changes;
    },
    onSuccess: async (changes) => {
      const next = [
        ...(q.data ?? []).filter(
          (c) => !changes.some((n) => n.chave === c.chave),
        ),
        ...changes,
      ];
      form.reset(dadosDoFormulario(next));
      client.setQueryData(["configuracao"], next);
      await Promise.all(
        ["configuracao", "horarios", "carrinho", "cardapio"].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
      toast.success("Configurações salvas.");
    },
    onError: mostrarErro,
  });
  const dirty = form.formState.isDirty;
  useEffect(() => {
    if (q.data && !dirty && !save.isPending)
      form.reset(dadosDoFormulario(q.data));
  }, [q.data, dirty, save.isPending, form]);
  if (q.isPending) return <p role="status">Carregando configurações…</p>;
  if (!q.data)
    return (
      <div role="alert">
        <p>Não foi possível carregar as configurações.</p>
        <Button onClick={() => void q.refetch()}>Tentar novamente</Button>
      </div>
    );
  const errors = form.formState.errors;
  return (
    <form
      className="mx-auto max-w-4xl space-y-5 rounded-md bg-white p-5 text-neutral-900"
      onSubmit={form.handleSubmit((d) => save.mutate(d))}
    >
      {q.isError && (
        <div role="alert">
          Não foi possível atualizar as configurações. Sua edição foi
          preservada.{" "}
          <Button type="button" onClick={() => void q.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}
      <fieldset disabled={save.isPending || q.isError} className="space-y-5">
        <section className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["cashback", "Cashback (%)"],
              ["minimo", "Pedido mínimo (R$)"],
              ["intervalo", "Intervalo dos horários (minutos)"],
              ["telefone", "Telefone da loja"],
              ["instagram", "Instagram"],
              ["facebook", "Facebook"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm font-semibold">
              {label}
              <Input
                type={
                  ["cashback", "minimo", "intervalo"].includes(key)
                    ? "number"
                    : "text"
                }
                step={key === "intervalo" ? "1" : "0.01"}
                {...form.register(key)}
                error={errors[key]?.message}
              />
            </label>
          ))}
        </section>
        <fieldset className="grid gap-3 rounded border p-4 md:grid-cols-2">
          <legend className="font-bold">Endereço de retirada</legend>
          {(
            [
              ["rua", "Rua de retirada"],
              ["numero", "Número de retirada"],
              ["bairro", "Bairro de retirada"],
              ["complemento", "Complemento"],
              ["referencia", "Referência"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              {label}
              <Input {...form.register(key)} error={errors[key]?.message} />
            </label>
          ))}
        </fieldset>
        <fieldset className="space-y-3 rounded border p-4">
          <legend className="font-bold">Entrega</legend>
          <label className="flex gap-2">
            <input type="checkbox" {...form.register("entrega")} />
            Habilitar entrega
          </label>
          <label className="block text-sm">
            Taxa fixa de entrega (R$)
            <Input
              type="number"
              step="0.01"
              {...form.register("taxa")}
              error={errors.taxa?.message}
            />
          </label>
          <p className="text-sm text-neutral-600">
            Informe o mesmo CEP nos dois campos para atender somente um CEP.
            Cada bairro deve ocupar uma linha.
          </p>
          {ceps.fields.map((field, i) => (
            <div key={field.id} className="flex items-start gap-2">
              <label className="flex-1 text-sm">
                CEP inicial {i + 1}
                <Input
                  maxLength={8}
                  inputMode="numeric"
                  {...form.register(`ceps.${i}.inicio`)}
                  error={errors.ceps?.[i]?.inicio?.message}
                />
              </label>
              <label className="flex-1 text-sm">
                CEP final {i + 1}
                <Input
                  maxLength={8}
                  inputMode="numeric"
                  {...form.register(`ceps.${i}.fim`)}
                  error={errors.ceps?.[i]?.fim?.message}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                aria-label={`Remover faixa ${i + 1}`}
                onClick={() => ceps.remove(i)}
              >
                Remover
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={ceps.fields.length >= 50}
            onClick={() => ceps.append({ inicio: "", fim: "" })}
          >
            Adicionar faixa de CEP
          </Button>
          <label className="block text-sm">
            Bairros atendidos
            <textarea
              className="mt-1 block min-h-20 w-full rounded border p-2"
              {...form.register("bairros")}
            />
          </label>
          {errors.bairros && (
            <p role="alert" className="text-sm text-red-600">
              {errors.bairros.message}
            </p>
          )}
        </fieldset>
        <fieldset className="space-y-3 rounded border p-4">
          <legend className="font-bold">Horários de atendimento</legend>
          {dias.map(([key, label], i) => (
            <section
              key={key}
              className="space-y-2 border-b pb-3 last:border-0"
            >
              <label className="flex gap-2 font-semibold">
                <input type="checkbox" {...form.register(`dias.${i}.aberto`)} />
                {label}
              </label>
              {form.watch(`dias.${i}.aberto`) && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ["abertura", "Abertura"],
                        ["fechamento", "Fechamento"],
                      ] as const
                    ).map(([field, title]) => (
                      <label key={field} className="text-sm">
                        {title} de {label}
                        <Input
                          type="time"
                          aria-label={`${title} de ${label}`}
                          {...form.register(`dias.${i}.${field}`)}
                          error={errors.dias?.[i]?.[field]?.message}
                        />
                      </label>
                    ))}
                  </div>
                  <label className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      {...form.register(`dias.${i}.intervalo`)}
                    />
                    Intervalo de {label}
                  </label>
                  {form.watch(`dias.${i}.intervalo`) && (
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          ["inicio", "Início do intervalo"],
                          ["fim", "Fim do intervalo"],
                        ] as const
                      ).map(([field, title]) => (
                        <label key={field} className="text-sm">
                          {title} de {label}
                          <Input
                            type="time"
                            aria-label={`${title} de ${label}`}
                            {...form.register(`dias.${i}.${field}`)}
                            error={errors.dias?.[i]?.[field]?.message}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          ))}
        </fieldset>
        <div className="flex gap-3">
          <Button type="submit" loading={save.isPending}>
            Salvar configurações
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!dirty}
            onClick={() => form.reset(dadosDoFormulario(q.data))}
          >
            Descartar alterações
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
