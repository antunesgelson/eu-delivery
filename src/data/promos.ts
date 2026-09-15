export const cashbackBalance = 18.5;
export const cashbackExpiration = '30/08/2026';
export const loyaltyCurrentOrders = 4;
export const loyaltyGoalOrders = 6;
export const loyaltyRemainingOrders = Math.max(loyaltyGoalOrders - loyaltyCurrentOrders, 0);
export const loyaltyProgress = Math.round((loyaltyCurrentOrders / loyaltyGoalOrders) * 100);

export const promoNotificationCount =
    Number(cashbackBalance > 0) + Number(loyaltyRemainingOrders > 0);
