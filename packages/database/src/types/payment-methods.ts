import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { paymentMethods } from "../tables/payment-methods";

export type PaymentMethod = InferSelectModel<typeof paymentMethods>;
export type InsertPaymentMethod = InferInsertModel<typeof paymentMethods>;
