type OrderItemCustomization = string;

type OrderItem = {
    quantity: number;
    name: string;
    customizations?: OrderItemCustomization[];
    price: number;
};

type PaymentMethod = {
    type: string;
    amount: number;
};

export type OrderDetailsDTO = {
    id: string;
    date: string;
    time: string;
    canBeRated: boolean;
    items: OrderItem[];
    subtotal: number;
    deliveryFee: string | number;
    total: number;
    address: string;
    paymentMethod: PaymentMethod[];
};