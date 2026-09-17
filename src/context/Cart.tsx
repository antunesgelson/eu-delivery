"use client";
import React, { createContext, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CartDTO } from "@/dto/cartDTO";
import { CupomDTO } from "@/dto/cupomDTO";
import { ProdutosDTO } from "@/dto/productDTO";
import { api, mostrarErro } from "@/service/api";
import useAuth from "@/hook/useAuth";
import { useCuponsPublicos } from "@/hook/useLoja";
type Carrinho = CartDTO & {
  cupom?: CupomDTO;
  valorFinal: number;
  descontoCupom: number;
  taxaEntrega: number;
};
type Contexto = {
  selectedItemId: string | null;
  setSelectedItemId: (id: string) => void;
  cart?: Carrinho;
  cupom?: CupomDTO;
  cuponsFree?: CupomDTO[];
  configData: any[];
  isPending: boolean;
  isLoading: boolean;
  isError: boolean;
  handleUpdateCart: () => void;
  handleUpdateCuponsFree: () => void;
  handleUpdateCupom: () => void;
  addItemToCart: (
    p: ProdutosDTO,
    q: number,
    obs?: string,
    opcoes?: {
      adicionais?: string[];
      ingredientes?: string[];
      substituicoes?: Array<{ removerId: string; adicionarId: string }>;
    },
  ) => Promise<void>;
  increaseItemQuantity: (id: number) => Promise<void>;
  removeItemFromCart: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  choosePickupLocation: () => Promise<void>;
  chooseDeliveryAddress: (id: number) => Promise<void>;
  setCartSchedule: (date: string) => Promise<void>;
  setPaymentMethod: (method: string) => Promise<void>;
  setCashbackUsage: (value: number) => Promise<void>;
  applyCoupon: (c: Pick<CupomDTO, "nome">) => Promise<void>;
  removeCoupon: () => Promise<void>;
  sendLocalOrder: () => Promise<{ ok: boolean; errors: string[]; id?: number }>;
};
export const CartContext = createContext<Contexto>({} as Contexto);
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth(),
    client = useQueryClient();
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(
    null,
  );
  const cartQuery = useQuery<Carrinho>({
    queryKey: ["carrinho"],
    queryFn: async ({ signal }) => (await api.get("/pedido/carrinho", { signal })).data,
    enabled: isAuthenticated,
    retry: false,
  });
  const config = useQuery({
    queryKey: ["configuracao"],
    queryFn: async () => (await api.get("/configuracao")).data,
  });
  const coupons = useCuponsPublicos();
  const [queuedWrites, setQueuedWrites] = React.useState(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const mutation = useMutation({
    mutationFn: async ({
      method,
      path,
      data,
    }: {
      method: "post" | "put" | "patch" | "delete";
      path: string;
      data?: unknown;
    }) => (await api.request({ method, url: path, data })).data,
    onSuccess: (cart) => client.setQueryData(["carrinho"], cart),
  });
  const executar = useCallback(
    async (
      method: "post" | "put" | "patch" | "delete",
      path: string,
      data?: unknown,
    ) => {
      if (!isAuthenticated) {
        window.location.href = `/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
        throw new Error("Entre na sua conta para continuar.");
      }
      setQueuedWrites(count => count + 1);
      const result = queue.current
        .catch(() => {})
        .then(async () => {
          await client.cancelQueries({ queryKey: ['carrinho'] });
          return mutation.mutateAsync({ method, path, data: typeof data === 'function' ? data() : data });
        });
      // A falha é exibida ao chamador sem bloquear operações futuras ou o checkout.
      queue.current = result.catch(() => {});
      try {
        await result;
      } catch (e) {
        mostrarErro(e);
        throw e;
      } finally {
        setQueuedWrites(count => count - 1);
      }
    },
    [isAuthenticated, mutation, client],
  );
  const editar = useCallback(
    (data: unknown) => executar("put", "/pedido/carrinho", data),
    [executar],
  );
  const setCashbackUsage = useCallback(
    (cashBack: number) => editar({ cashBack }),
    [editar],
  );
  const finalizeMutation = useMutation({
    mutationFn: async (id: number) =>
      (
        await api.post(
          "/pedido/finalizar",
          {},
          { headers: { "Idempotency-Key": `checkout-${id}` } },
        )
      ).data,
  });
  const sendLocalOrder = async () => {
    try {
      await queue.current;
      const cart = client.getQueryData<Carrinho>(["carrinho"]);
      if (!cart) throw new Error("Carrinho não carregado.");
      const result = await finalizeMutation.mutateAsync(cart.id);
      await client.invalidateQueries({ queryKey: ["carrinho"] });
      await client.invalidateQueries({ queryKey: ["beneficios"] });
      await client.invalidateQueries({ queryKey: ["pedido-ativo"] });
      await client.invalidateQueries({ queryKey: ["pedidos"] });
      return { ok: true, errors: [], id: result.id };
    } catch (e: any) {
      return {
        ok: false,
        errors: [
          e.response?.data?.message ?? "Não foi possível enviar o pedido.",
        ],
      };
    }
  };
  return (
    <CartContext.Provider
      value={{
        selectedItemId,
        setSelectedItemId,
        cart: cartQuery.data,
        cupom: cartQuery.data?.cupom,
        cuponsFree: coupons.data,
        configData: config.data ?? [],
        isPending: queuedWrites > 0 || finalizeMutation.isPending,
        isLoading: isAuthenticated && cartQuery.isPending,
        isError: cartQuery.isError,
        handleUpdateCart: () => {
          void cartQuery.refetch();
        },
        handleUpdateCuponsFree: () => {
          void coupons.refetch();
        },
        handleUpdateCupom: () => {
          void cartQuery.refetch();
        },
        addItemToCart: (p, q, obs = "", opcoes = {}) =>
          executar("post", "/pedido/carrinho", {
            produtoId: p.id,
            quantidade: q,
            obs,
            ...opcoes,
          }),
        increaseItemQuantity: (id) =>
          executar("patch", `/pedido/carrinho/item/${id}`, () => ({
            quantidade:
              (client.getQueryData<Carrinho>(["carrinho"])?.itens.find((i) => i.id === id)?.quantidade ??
                0) + 1,
          })),
        removeItemFromCart: (id) =>
          executar("delete", `/pedido/carrinho/item/${id}`),
        clearCart: () => executar("delete", "/pedido/carrinho"),
        choosePickupLocation: () => editar({ tipoRecebimento: "pickup" }),
        chooseDeliveryAddress: (enderecoId) =>
          editar({ tipoRecebimento: "delivery", enderecoId }),
        setCartSchedule: (dataEntrega) => editar({ dataEntrega }),
        setPaymentMethod: (formaPagamento) => editar({ formaPagamento }),
        setCashbackUsage,
        applyCoupon: (c) => editar({ cupom: c.nome }),
        removeCoupon: () => editar({ cupom: "" }),
        sendLocalOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
