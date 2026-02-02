import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { checkoutSessions } from "../tables/checkout-sessions";

export type CheckoutSession = InferSelectModel<typeof checkoutSessions>;
export type InsertCheckoutSession = InferInsertModel<typeof checkoutSessions>;
