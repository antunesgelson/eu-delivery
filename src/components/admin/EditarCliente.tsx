"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api, mostrarErro } from "@/service/api";
import { ClienteCadastro } from "@/hook/useClientesAdmin";
import useFormatters from "@/hook/useFormatters";
import { cpfValido, nascimentoValido } from "@/utils/validacaoCliente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const clienteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(150, "Use até 150 caracteres."),
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
  tel: z
    .string()
    .trim()
    .transform((value) => {
      if (!value) return "";
      const digits = value.replace(/\D/g, "");
      return digits.length <= 11 ? `55${digits}` : digits;
    })
    .refine(
      (value) => !value || /^55\d{10,11}$/.test(value),
      "Informe o telefone com DDD.",
    ),
  cpf: z.string().refine(cpfValido, "Informe um CPF válido."),
  dataDeNascimento: z
    .string()
    .refine(
      nascimentoValido,
      "Informe uma data de nascimento válida, sem data futura.",
    ),
});
export type ClienteForm = z.infer<typeof clienteSchema>;

export default function EditarCliente({
  cliente,
  onClose,
}: {
  cliente: ClienteCadastro;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const sending = useRef(false);
  const { cpfFormat } = useFormatters();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
    // O componente é montado por cliente; reconsultar a listagem não substitui a edição.
    defaultValues: {
      nome: cliente.nome ?? "",
      email: cliente.email ?? "",
      tel: cliente.tel ?? "",
      cpf: cpfFormat(cliente.cpf ?? ""),
      dataDeNascimento: cliente.dataDeNascimento?.slice(0, 10) ?? "",
    },
  });
  const cpf = watch("cpf");
  useEffect(() => {
    if (cpf) setValue("cpf", cpfFormat(cpf));
  }, [cpf, cpfFormat, setValue]);
  const save = useMutation({
    mutationFn: async (data: ClienteForm) =>
      api.put(`/admin/clientes/${cliente.id}`, {
        nome: data.nome,
        email: data.email || null,
        tel: data.tel || null,
        cpf: data.cpf.replace(/\D/g, ""),
        dataDeNascimento: data.dataDeNascimento || null,
      }),
    onSuccess: async () => {
      await Promise.all(
        [
          "clientes",
          "admin-clientes",
          "admin-cliente",
          "pedidos",
          "operacao",
          "relatorios",
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
      toast.success("Cliente atualizado.");
      onClose();
    },
    onError: mostrarErro,
    onSettled: () => {
      sending.current = false;
    },
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !sending.current) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>
            Atualize os dados do cadastro. Campos opcionais vazios serão
            removidos.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="space-y-3"
          onSubmit={handleSubmit((data) => {
            if (sending.current) return;
            sending.current = true;
            save.mutate(data);
          })}
        >
          <fieldset disabled={save.isPending} className="space-y-3">
            {(
              [
                ["nome", "Nome", "text"],
                ["email", "E-mail", "email"],
                ["tel", "Telefone com DDD", "tel"],
                ["cpf", "CPF", "text"],
                ["dataDeNascimento", "Nascimento", "date"],
              ] as const
            ).map(([key, label, type]) => (
              <div key={key}>
                <label
                  htmlFor={`cliente-${key}`}
                  className="mb-1 block text-sm"
                >
                  {label}
                </label>
                <Input
                  id={`cliente-${key}`}
                  type={type}
                  {...register(key)}
                  error={errors[key]?.message}
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {save.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </fieldset>
          {isDirty && (
            <p className="text-sm text-muted-foreground">
              Alterações não salvas.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
