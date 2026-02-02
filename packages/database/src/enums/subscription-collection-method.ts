import { pgEnum } from "drizzle-orm/pg-core";

export const subscriptionCollectionMethodEnum = pgEnum("subscription_collection_method", [
  "charge_automatically",
  "send_invoice",
]);
