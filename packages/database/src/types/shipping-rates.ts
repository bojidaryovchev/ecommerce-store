import { shippingRates } from "../tables/shipping-rates";

export type ShippingRate = typeof shippingRates.$inferSelect;
export type NewShippingRate = typeof shippingRates.$inferInsert;
