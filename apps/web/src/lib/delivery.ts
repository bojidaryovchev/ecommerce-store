/**
 * The delivery terms, in one place for the checkout, the cart, the top bar and the delivery page.
 * Set in euros through the environment (public, so the cart can show them):
 *
 *   NEXT_PUBLIC_DELIVERY_FEE        the fee for an order below the free-delivery amount (default 0: free)
 *   NEXT_PUBLIC_DELIVERY_FREE_FROM  orders from this amount travel free (default 0: every order)
 *
 * With neither set, delivery is free for every order.
 */
const euros = (value: string | undefined) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
};

export const DELIVERY = {
  /** Cents. */
  fee: euros(process.env.NEXT_PUBLIC_DELIVERY_FEE),
  /** Cents; 0 when every order travels free. */
  freeFrom: euros(process.env.NEXT_PUBLIC_DELIVERY_FREE_FROM),
} as const;

/** Every order travels free. */
export const DELIVERY_ALWAYS_FREE = DELIVERY.fee === 0;

/** What delivery costs for an order of this many cents. */
export const deliveryFee = (subtotal: number): number =>
  DELIVERY_ALWAYS_FREE || (DELIVERY.freeFrom > 0 && subtotal >= DELIVERY.freeFrom) ? 0 : DELIVERY.fee;

/** How much more the order needs to travel free; 0 when it already does (or never can). */
export const untilFreeDelivery = (subtotal: number): number =>
  DELIVERY_ALWAYS_FREE || DELIVERY.freeFrom === 0 ? 0 : Math.max(0, DELIVERY.freeFrom - subtotal);
