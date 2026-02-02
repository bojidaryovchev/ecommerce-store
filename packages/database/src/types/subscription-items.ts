import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { subscriptionItems } from "../tables/subscription-items";

export type SubscriptionItem = InferSelectModel<typeof subscriptionItems>;
export type InsertSubscriptionItem = InferInsertModel<typeof subscriptionItems>;
