"use client";
import useCart from "@/hook/useCart";
import { lerConfiguracao } from "@/hook/useAgendamento";
import { STORE_PICKUP_ADDRESS } from "@/data/store";

export default function StoreInfo() {
  const { configData } = useCart();
  const telefone =
    (configData ?? []).find((c) => c.chave === "TELEFONE")?.valor ?? "";
  const digits = telefone.replace(/\D/g, "");
  const numero = digits.length <= 11 ? `55${digits}` : digits;
  const endereco = lerConfiguracao(
    configData,
    "ENDERECO",
    STORE_PICKUP_ADDRESS,
  );
  const redes = lerConfiguracao<Record<string, string>>(
    configData,
    "REDESSOCIAIS",
    {},
  );
  const horarios = lerConfiguracao<
    Record<
      string,
      {
        abertura?: string;
        fechamento?: string;
        inicio_intervalo?: string;
        fim_intervalo?: string;
      }
    >
  >(configData, "HORARIOATENDIMENTO", {});
  const dias = [
    ["seg", "Segunda-feira"],
    ["ter", "Terça-feira"],
    ["qua", "Quarta-feira"],
    ["qui", "Quinta-feira"],
    ["sex", "Sexta-feira"],
    ["sab", "Sábado"],
    ["dom", "Domingo"],
  ];
  return (
    <section
      aria-label="Informações da loja"
      className="mx-4 mt-7 space-y-4 rounded-md border bg-white p-5 text-sm lg:mx-auto lg:w-6/12"
    >
      <h2 className="text-lg font-bold">Informações da loja</h2>
      <div>
        <h3 className="font-semibold">Retirada</h3>
        <p>
          {endereco.rua}, {endereco.numero} — {endereco.bairro}
        </p>
        {endereco.complemento && <p>{endereco.complemento}</p>}
        {endereco.referencia && <p>{endereco.referencia}</p>}
      </div>
      {/^55\d{10,11}$/.test(numero) && (
        <div className="flex flex-wrap gap-4">
          <a
            className="font-semibold text-primary underline"
            href={`https://wa.me/${numero}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Falar com a loja no WhatsApp
          </a>
          <a className="text-primary underline" href={`tel:+${numero}`}>
            Ligar: {telefone}
          </a>
        </div>
      )}
      <div className="flex gap-4">
        {(
          [
            ["instagram", "Instagram"],
            ["facebook", "Facebook"],
          ] as const
        ).map(
          ([key, title]) =>
            /^https?:\/\//.test(redes[key] ?? "") && (
              <a
                key={key}
                className="text-primary underline"
                href={redes[key]}
                target="_blank"
                rel="noopener noreferrer"
              >
                {title}
              </a>
            ),
        )}
      </div>
      <details>
        <summary className="cursor-pointer font-semibold">
          Horários de atendimento
        </summary>
        <dl className="mt-2 space-y-1">
          {dias.map(([key, label]) => {
            const rule =
              horarios[key] ??
              (["sab", "dom"].includes(key)
                ? { abertura: "11:30", fechamento: "14:00" }
                : {});
            return (
              <div key={key} className="flex flex-wrap justify-between gap-2">
                <dt>{label}</dt>
                <dd>
                  {rule.abertura && rule.fechamento
                    ? `${rule.abertura} às ${rule.fechamento}${rule.inicio_intervalo && rule.fim_intervalo ? ` · Intervalo ${rule.inicio_intervalo} às ${rule.fim_intervalo}` : ""}`
                    : "Fechado"}
                </dd>
              </div>
            );
          })}
        </dl>
      </details>
    </section>
  );
}
