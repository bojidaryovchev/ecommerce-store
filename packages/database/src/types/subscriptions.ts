import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { subscriptions } from "../tables/subscriptions";

export type Subscription = InferSelectModel<typeof subscriptions>;
export type InsertSubscription = InferInsertModel<typeof subscriptions>;
