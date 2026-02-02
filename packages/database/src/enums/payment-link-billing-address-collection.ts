import { pgEnum } from "drizzle-orm/pg-core";

export const paymentLinkBillingAddressCollectionEnum = pgEnum("payment_link_billing_address_collection", [
  "auto",
  "required",
]);
