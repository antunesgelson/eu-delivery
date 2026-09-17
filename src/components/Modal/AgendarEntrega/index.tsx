'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import useCart from '@/hook/useCart';
import { datasAtendimento, useHorarios } from '@/hook/useAgendamento';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FaCircleCheck, FaRegCircle } from 'react-icons/fa6';

export function ModalAgendarEntrega({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setCartSchedule, configData, cart, isPending } = useCart();
  const dates = useMemo(() => datasAtendimento(configData), [configData]);
  const [date, setDate] = useState('');
  const [selected, setSelected] = useState('');
  const slots = useHorarios(date, open);
  const available = (slots.data ?? []).filter(s => s.disponivel);
  const delivery = cart?.tipoRecebimento === 'delivery';
  useEffect(() => {
    if (open) { setDate(dates[0]?.value ?? ''); setSelected(''); }
  }, [open, dates]);
  async function confirm() {
    if (!available.some(s => s.data === selected)) return;
    try { await setCartSchedule(selected); } catch { return; }
    toast.success('Horário agendado com sucesso.');
    onClose();
  }
  return <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="flex max-h-[85vh] w-11/12 max-w-[390px] flex-col overflow-hidden rounded-md bg-white p-0">
      <DialogHeader className="border-b px-5 pb-4 pt-5">
        <DialogTitle className="text-center text-[19px] font-extrabold">{delivery ? 'Quando quer receber?' : 'Quando quer retirar?'}</DialogTitle>
        <DialogDescription className="text-center">Escolha uma data e um horário disponível.</DialogDescription>
      </DialogHeader>
      <div className="min-h-0 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-4 gap-2 pb-4">
          {dates.map(d => <button key={d.value} type="button" aria-pressed={date === d.value} onClick={() => { setDate(d.value); setSelected(''); }} className={`rounded-md border p-2 text-center ${date === d.value ? 'border-emerald-500 text-emerald-700' : ''}`}>
            <span className="block text-xs capitalize">{d.title}</span><strong>{d.label}</strong>
          </button>)}
        </div>
        {!dates.length && <p>Nenhuma data de atendimento disponível.</p>}
        {date && slots.isPending && <p role="status">Carregando horários…</p>}
        {slots.isError && <div role="alert">Não foi possível carregar os horários. <Button onClick={() => slots.refetch()}>Tentar novamente</Button></div>}
        {slots.isSuccess && !available.length && <p>Nenhum horário disponível nesta data. Escolha outro dia.</p>}
        <div className="space-y-2">
          {available.map(slot => <button key={slot.data} type="button" onClick={() => setSelected(slot.data)} aria-pressed={selected === slot.data} className={`flex w-full items-center justify-between rounded-md border p-4 text-sm font-semibold ${selected === slot.data ? 'border-emerald-500' : ''}`}>
            {delivery ? 'Receber' : 'Retirar'} entre {slot.horario} e {slot.fim}
            {selected === slot.data ? <FaCircleCheck className="text-emerald-500" size={23} /> : <FaRegCircle size={23} />}
          </button>)}
        </div>
      </div>
      <DialogFooter className="border-t bg-white p-4">
        <Button variant="success" className="w-full" loading={isPending} disabled={isPending || slots.isError || !available.some(s => s.data === selected)} onClick={confirm}>Confirmar horário</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
