"use client";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, mostrarErro } from "@/service/api";
import { PedidoAPI } from "@/hook/usePedidos";
import { Horario } from "@/hook/useAgendamento";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const schema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data."),
  horario: z.string().regex(/^\d{2}:\d{2}$/, "Escolha um horário disponível."),
  obs: z.string().max(500, "Use até 500 caracteres."),
});
export type AgendamentoForm = z.infer<typeof schema>;
const empty = { data: "", horario: "", obs: "" };

export default function EditarAgendamento({ id }: { id: string }) {
  const [open, setOpen] = React.useState(false);
  const sending = React.useRef(false);
  const client = useQueryClient();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<AgendamentoForm>({
    resolver: zodResolver(schema),
    defaultValues: empty,
  });
  const date = watch("data"),
    time = watch("horario");
  const order = useQuery<PedidoAPI>({
    queryKey: ["pedido-edicao", id],
    queryFn: async ({ signal }) =>
      (await api.get(`/pedido/${id}`, { signal })).data,
    enabled: open,
    retry: false,
  });
  const canReschedule = order.data?.status === "analysis";
  const editable = ["analysis", "production", "ready"].includes(
    order.data?.status ?? "",
  );
  React.useEffect(() => {
    if (!open || !order.data) return;
    const date = new Date(order.data.dataEntrega!);
    reset(
      {
        data: date.toLocaleDateString("en-CA", {
          timeZone: "America/Sao_Paulo",
        }),
        horario: date.toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
        }),
        obs: order.data.obs ?? "",
      },
      { keepDirtyValues: true },
    );
  }, [open, order.data, reset]);
  const slots = useQuery<Horario[]>({
    queryKey: ["horarios-edicao", date],
    queryFn: async ({ signal }) =>
      (await api.get(`/pedido/horarios/${date}`, { signal })).data,
    enabled: open && canReschedule && !!date,
    retry: false,
  });
  const available = slots.data?.filter((slot) => slot.disponivel) ?? [];
  const validTime = available.some((slot) => slot.horario === time);
  const save = useMutation({
    mutationFn: async (values: AgendamentoForm) => {
      await client.cancelQueries({ queryKey: ["pedido-edicao", id] });
      return api.patch(`/admin/pedidos/${id}`, {
        obs: values.obs,
        ...(canReschedule
          ? { dataEntrega: `${values.data}T${values.horario}:00-03:00` }
          : {}),
      });
    },
    onSuccess: async () => {
      setOpen(false);
      reset(empty);
      await Promise.all(
        [
          "operacao",
          "pedido-edicao",
          "pedido",
          "pedido-ativo",
          "pedidos",
          "cardapio",
          "admin-catalogo",
          "relatorios",
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
      toast.success("Pedido atualizado.");
    },
    onError: (error) => {
      mostrarErro(error);
      void client.invalidateQueries({ queryKey: ["pedido-edicao", id] });
    },
    onSettled: () => {
      sending.current = false;
    },
  });
  const blocked =
    save.isPending ||
    order.isFetching ||
    order.isError ||
    !editable ||
    (canReschedule && (slots.isFetching || slots.isError || !validTime));
  const dateField = register("data");
  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          reset(empty);
          setOpen(true);
        }}
      >
        Editar agendamento
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!save.isPending) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar pedido #{id}</DialogTitle>
            <DialogDescription>
              Horário pode ser alterado antes do início da produção. O estoque
              será conferido novamente. Horários de Brasília.
            </DialogDescription>
          </DialogHeader>
          {order.isPending ? (
            <p role="status">Carregando pedido…</p>
          ) : order.isError && !order.data ? (
            <div role="alert">
              <p>Não foi possível carregar o pedido.</p>
              <Button
                disabled={order.isFetching}
                onClick={() => void order.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <form
              noValidate
              className="space-y-3"
              onSubmit={handleSubmit((values) => {
                if (sending.current || blocked) return;
                sending.current = true;
                save.mutate(values);
              })}
            >
              {order.isError && (
                <div role="alert">
                  <p>
                    Não foi possível atualizar o pedido. Suas alterações foram
                    preservadas.
                  </p>
                  <Button
                    type="button"
                    disabled={order.isFetching}
                    onClick={() => void order.refetch()}
                  >
                    Atualizar pedido
                  </Button>
                </div>
              )}
              {!editable && (
                <p role="alert">Este pedido não pode mais ser editado.</p>
              )}
              {editable && !canReschedule && (
                <p>
                  O pedido já entrou em produção. Apenas a observação pode ser
                  alterada.
                </p>
              )}
              <fieldset
                disabled={save.isPending || !editable}
                className="space-y-3"
              >
                <label className="block" htmlFor="agendamento-data">
                  Data
                </label>
                <Input
                  id="agendamento-data"
                  type="date"
                  {...dateField}
                  disabled={!canReschedule}
                  error={errors.data?.message}
                  onChange={(event) => {
                    void dateField.onChange(event);
                    setValue("horario", "", { shouldDirty: true });
                  }}
                />
                <label className="block" htmlFor="agendamento-horario">
                  Horário
                </label>
                <select
                  id="agendamento-horario"
                  {...register("horario")}
                  disabled={!canReschedule || slots.isFetching || slots.isError}
                  className="block rounded border p-2"
                >
                  <option value="">Escolha um horário</option>
                  {!canReschedule && time && (
                    <option value={time}>{time}</option>
                  )}
                  {canReschedule &&
                    available.map((slot) => (
                      <option key={slot.horario} value={slot.horario}>
                        {slot.horario}
                      </option>
                    ))}
                </select>
                {errors.horario && (
                  <p role="alert" className="text-sm text-red-600">
                    {errors.horario.message}
                  </p>
                )}
                {canReschedule && slots.isFetching && (
                  <p role="status">Consultando horários…</p>
                )}
                {canReschedule && slots.isError && (
                  <div role="alert">
                    <p>Não foi possível consultar os horários.</p>
                    <Button type="button" onClick={() => void slots.refetch()}>
                      Tentar novamente os horários
                    </Button>
                  </div>
                )}
                {canReschedule && slots.isSuccess && !available.length && (
                  <p role="status">
                    Nenhum horário disponível nesta data. Escolha outra data.
                  </p>
                )}
                <label className="block" htmlFor="agendamento-obs">
                  Observação
                </label>
                <textarea
                  id="agendamento-obs"
                  className="block w-full rounded border p-2"
                  {...register("obs")}
                />
                {errors.obs && (
                  <p role="alert" className="text-sm text-red-600">
                    {errors.obs.message}
                  </p>
                )}
                <Button type="submit" disabled={blocked}>
                  {save.isPending ? "Salvando…" : "Salvar"}
                </Button>
              </fieldset>
              {Object.keys(dirtyFields).length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Alterações não salvas.
                </p>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
