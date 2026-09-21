import { ItensDTO } from "@/dto/cartDTO";

export function observacaoDoItem(item: Pick<ItensDTO, "obs" | "produto">) {
  const produto = item.produto;
  const substituicoes = produto.substituicoes ?? [];
  const removidos = (produto.removidos ?? []).filter(
    (i) => !substituicoes.some((s) => s.removerId === i.id),
  );
  return [
    item.obs,
    ...removidos.map((i) => `Sem ${i.nome}`),
    ...substituicoes.map((s) => `${s.remover} substituído por ${s.adicionar}`),
    produto.adicionais?.length
      ? `Adicionais: ${produto.adicionais.map((a) => a.nome).join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
