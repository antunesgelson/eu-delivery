import { CartContext } from "@/context/Cart";
import { useContext } from "react";

const useCart = () => {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart must be used within an CartProvider');
    }

    return context;
}

export default useCart;