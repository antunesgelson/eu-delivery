"use client";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, mostrarErro } from "@/service/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
export default function EditarAgendamento({ id }: { id: string }) {
  const [open, setOpen] = React.useState(false),
    [obs, setObs] = React.useState(""),
    [date, setDate] = React.useState(""),
    [time, setTime] = React.useState("");
  const client = useQueryClient();
  const order = useQuery({
    queryKey: ["pedido-edicao", id],
    queryFn: async () => (await api.get(`/pedido/${id}`)).data,
    enabled: open,
  });
  React.useEffect(() => {
    if (!order.data) return;
    setObs(order.data.obs ?? "");
    const d = new Date(order.data.dataEntrega);
    setDate(d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }));
    setTime(
      d.toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  }, [order.data]);
  const slots = useQuery<any[]>({
    queryKey: ["horarios-edicao", date],
    queryFn: async () => (await api.get(`/pedido/horarios/${date}`)).data,
    enabled: open && !!date,
  });
  const save = useMutation({
    mutationFn: () =>
      api.patch(`/admin/pedidos/${id}`, {
        obs,
        dataEntrega:
          order.data?.status === "analysis"
            ? `${date}T${time}:00-03:00`
            : undefined,
      }),
    onSuccess: () => {
      setOpen(false);
      void client.invalidateQueries({ queryKey: ["operacao"] });
      void client.invalidateQueries({ queryKey: ["pedido-edicao", id] });
      toast.success("Pedido atualizado.");
    },
    onError: mostrarErro,
  });
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Editar agendamento
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar pedido #{id}</DialogTitle>
            <DialogDescription>
              Horário pode ser alterado antes do início da produção. O estoque
              será conferido novamente.
            </DialogDescription>
          </DialogHeader>
          {order.isPending ? (
            <p>Carregando…</p>
          ) : order.isError ? (
            <Button onClick={() => order.refetch()}>Tentar novamente</Button>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <label className="block">
                Data
                <input
                  type="date"
                  className="block rounded border p-2"
                  value={date}
                  disabled={order.data?.status !== "analysis"}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label className="block">
                Horário
                <select
                  value={time}
                  disabled={order.data?.status !== "analysis"}
                  onChange={(e) => setTime(e.target.value)}
                  className="block rounded border p-2"
                >
                  <option value={time}>{time}</option>
                  {slots.data
                    ?.filter((s) => s.disponivel && s.horario !== time)
                    .map((s) => <option key={s.horario}>{s.horario}</option>)}
                </select>
              </label>
              <label className="block">
                Observação
                <textarea
                  className="block w-full rounded border p-2"
                  maxLength={500}
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                />
              </label>
              <Button disabled={save.isPending}>Salvar</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
