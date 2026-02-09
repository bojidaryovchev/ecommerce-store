import type { Cart, CartItem, Price, Product } from "@ecommerce/database/schema";

export type CartItemWithProduct = CartItem & {
  product: Product;
  price: Price;
};

export type CartWithItems = Cart & {
  items: CartItemWithProduct[];
};

export type CartSummary = {
  itemCount: number;
  subtotal: number;
  currency: string;
};
