"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api, mostrarErro } from "@/service/api";
import { ClienteAdmin } from "@/hook/useClientesAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const clientePdvSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(150, "Use até 150 caracteres."),
  tel: z
    .string()
    .transform((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length <= 11 ? `55${digits}` : digits;
    })
    .refine(
      (value) => /^55\d{10,11}$/.test(value),
      "Informe o telefone com DDD.",
    ),
});
export type ClientePdvFormData = z.infer<typeof clientePdvSchema>;

export function ClientePdv({
  cliente,
  initialSearch = "",
  disabled,
  onSelect,
}: {
  cliente?: ClienteAdmin;
  initialSearch?: string;
  disabled?: boolean;
  onSelect: (cliente: ClienteAdmin) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [term, setTerm] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const client = useQueryClient();
  const form = useForm<ClientePdvFormData>({
    resolver: zodResolver(clientePdvSchema),
    defaultValues: { nome: "", tel: "" },
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery<{ items: ClienteAdmin[]; total: number }>({
    queryKey: ["admin-clientes", "pdv", term, page],
    queryFn: async ({ signal }) =>
      (
        await api.get("/admin/clientes", {
          params: { search: term, page, limit: 10 },
          signal,
        })
      ).data,
    enabled: open && !creating,
  });
  function select(value: ClienteAdmin) {
    onSelect(value);
    setOpen(false);
  }
  const create = useMutation({
    mutationFn: async (data: ClientePdvFormData) =>
      (await api.post<ClienteAdmin>("/admin/clientes", data)).data,
    onSuccess: async (data) => {
      select(data);
      form.reset();
      setCreating(false);
      toast.success("Cliente selecionado.");
      await client.invalidateQueries({ queryKey: ["admin-clientes"] });
    },
    onError: mostrarErro,
  });

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setSearch(cliente ? "" : initialSearch);
          setCreating(false);
          setOpen(true);
        }}
        className="w-full rounded-md border border-[#0b98f6] bg-[#eff8ff] p-2 text-left text-sm text-[#303740] disabled:opacity-50"
      >
        <strong className="block">
          {cliente?.nome || "Selecionar cliente"}
        </strong>
        <span className="text-xs">
          {cliente
            ? `${cliente.tel || cliente.email || "Sem telefone"} · Trocar cliente`
            : "Buscar cadastro ou adicionar novo"}
        </span>
      </button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!create.isPending) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {creating ? "Novo cliente" : "Selecionar cliente"}
            </DialogTitle>
            <DialogDescription>
              Selecione o cadastro que receberá o pedido e os benefícios.
            </DialogDescription>
          </DialogHeader>
          {creating ? (
            <form
              onSubmit={form.handleSubmit((data) => create.mutate(data))}
              className="space-y-4"
            >
              <Input
                aria-label="Nome do novo cliente"
                placeholder="Nome completo"
                error={form.formState.errors.nome?.message}
                {...form.register("nome")}
              />
              <Input
                aria-label="Telefone do novo cliente"
                placeholder="Telefone com DDD"
                type="tel"
                error={form.formState.errors.tel?.message}
                {...form.register("tel")}
              />
              <p className="text-xs text-muted">
                Se o telefone já estiver cadastrado, o cadastro existente será
                selecionado.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={create.isPending}
                  onClick={() => setCreating(false)}
                >
                  Voltar
                </Button>
                <Button type="submit" loading={create.isPending}>
                  Salvar e selecionar
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <Input
                aria-label="Buscar cliente"
                placeholder="Nome, telefone ou e-mail"
                value={search}
                maxLength={100}
                onChange={(event) => setSearch(event.target.value)}
              />
              {query.isFetching && <p role="status">Buscando clientes…</p>}
              {query.isError && (
                <div role="alert">
                  Não foi possível carregar os clientes.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => query.refetch()}
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
              {query.isSuccess && !query.data.items.length && (
                <p>Nenhum cliente encontrado.</p>
              )}
              <div className="space-y-2">
                {query.data?.items.map((value) => (
                  <button
                    type="button"
                    key={value.id}
                    onClick={() => select(value)}
                    className="block w-full rounded border p-3 text-left hover:bg-slate-100"
                  >
                    <strong className="block">
                      {value.nome || "Cliente sem nome"}
                    </strong>
                    <span className="text-xs">
                      {value.tel || value.email || `Cadastro #${value.id}`}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page === 1 || query.isFetching}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <span className="text-xs">Página {page}</span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    !query.data ||
                    page * 10 >= query.data.total ||
                    query.isFetching
                  }
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
              <Button type="button" onClick={() => setCreating(true)}>
                Cadastrar novo cliente
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
