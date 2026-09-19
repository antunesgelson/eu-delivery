import { MovimentoBeneficioDTO, PremioDTO } from "@/dto/beneficiosDTO";
import Link from "next/link";

function date(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
const labels: Record<string, string> = {
  credito: "Cashback recebido",
  uso: "Cashback utilizado",
  estorno: "Cashback devolvido",
  reversao_credito: "Crédito revertido após estorno",
};

export function CashbackHistory({
  movimentos,
}: {
  movimentos: MovimentoBeneficioDTO[];
}) {
  return (
    <section
      aria-label="Histórico de cashback"
      className="rounded-md bg-white p-4 shadow-sm"
    >
      <h2 className="text-[17px] font-extrabold">Histórico de cashback</h2>
      <p className="mt-1 text-xs text-dark-500">
        Até 50 movimentações mais recentes. Horários de Brasília.
      </p>
      {!movimentos.length ? (
        <p className="mt-3 text-sm">Nenhuma movimentação de cashback ainda.</p>
      ) : (
        <ul className="mt-3 divide-y">
          {movimentos.map((movimento) => (
            <li key={movimento.id} className="space-y-1 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <strong>
                  {labels[movimento.tipo] ?? "Movimentação de cashback"}
                </strong>
                <span className="whitespace-nowrap">
                  {movimento.centavos > 0 ? "+" : ""}
                  {(movimento.centavos / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-xs text-dark-500">
                <Link
                  className="underline"
                  href={`/orderstatus?id=${movimento.pedidoId}`}
                >
                  Pedido #{movimento.pedidoId}
                </Link>
                <time dateTime={movimento.created_at}>
                  {date(movimento.created_at)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function LoyaltyPrizes({ premios }: { premios: PremioDTO[] }) {
  return (
    <section
      aria-label="Seus prêmios"
      className="rounded-md bg-white p-4 shadow-sm"
    >
      <h2 className="text-[17px] font-extrabold">Seus prêmios</h2>
      {!premios.length ? (
        <p className="mt-3 text-sm">
          Nenhum prêmio disponível ou entregue neste momento.
        </p>
      ) : (
        <ul className="mt-3 divide-y">
          {premios.map((premio) => (
            <li key={premio.id} className="space-y-1 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <strong>Prêmio #{premio.id}</strong>
                <span>{premio.resgatadoEm ? "Entregue" : "Disponível"}</span>
              </div>
              <p>Maionese da casa · ciclo {premio.ciclo}</p>
              {premio.resgatadoEm ? (
                <p className="text-xs text-dark-500">
                  Entrega registrada em {date(premio.resgatadoEm)} (Brasília).
                </p>
              ) : (
                <p className="text-xs text-dark-500">
                  Combine a retirada com a loja. A equipe registra a entrega do
                  prêmio.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
