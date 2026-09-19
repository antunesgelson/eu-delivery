export type PremioDTO = {
  id: number;
  ciclo: number;
  valido: boolean;
  resgatadoEm: string | null;
  created_at: string;
};

export type MovimentoBeneficioDTO = {
  id: number;
  pedidoId: number;
  tipo: string;
  centavos: number;
  created_at: string;
};

export type BeneficiosDTO = {
  cashbackBalance: number;
  cashbackExpiration: string | null;
  loyaltyCurrentOrders: number;
  loyaltyGoalOrders: number;
  loyaltyRemainingOrders: number;
  loyaltyProgress: number;
  promoNotificationCount: number;
  premios: PremioDTO[];
  movimentos: MovimentoBeneficioDTO[];
};
