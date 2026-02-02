import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { paymentIntents } from "../tables/payment-intents";

export type PaymentIntent = InferSelectModel<typeof paymentIntents>;
export type InsertPaymentIntent = InferInsertModel<typeof paymentIntents>;
