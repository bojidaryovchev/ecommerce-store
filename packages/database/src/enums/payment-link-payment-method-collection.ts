import { pgEnum } from "drizzle-orm/pg-core";

export const paymentLinkPaymentMethodCollectionEnum = pgEnum("payment_link_payment_method_collection", [
  "always",
  "if_required",
]);
