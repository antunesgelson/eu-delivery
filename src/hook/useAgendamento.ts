"use client";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/service/api';

export type Horario = { horario: string; fim: string; data: string; disponivel: boolean };
export type Configuracao = { chave: string; valor: string };
export function dataDaLoja(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function lerConfiguracao<T>(configs: Configuracao[] | undefined, chave: string, fallback: T): T {
  try { return JSON.parse(configs?.find(c => c.chave === chave)?.valor ?? 'null') ?? fallback; }
  catch { return fallback; }
}
export function datasAtendimento(configs: Configuracao[] | undefined) {
  const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const regras = lerConfiguracao<Record<string, { abertura?: string; fechamento?: string }>>(configs, 'HORARIOATENDIMENTO', {});
  const hoje = dataDaLoja();
  const dates: Array<{ value: string; title: string; label: string }> = [];
  for (let offset = 0; offset < 28 && dates.length < 8; offset++) {
    const date = new Date(hoje + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() + offset);
    const weekday = date.getUTCDay();
    const rule = regras[dias[weekday]] ?? ([0, 6].includes(weekday) ? { abertura: '11:30', fechamento: '14:00' } : null);
    if (!rule?.abertura || !rule.fechamento) continue;
    dates.push({
      value: date.toISOString().slice(0, 10),
      title: offset === 0 ? 'Hoje' : date.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'America/Sao_Paulo' }),
      label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }),
    });
  }
  return dates;
}
export function useHorarios(date: string, enabled = true) {
  return useQuery<Horario[]>({
    queryKey: ['horarios', date],
    queryFn: async () => (await api.get(`/pedido/horarios/${date}`)).data,
    enabled: enabled && !!date,
    refetchInterval: 30000,
  });
}
