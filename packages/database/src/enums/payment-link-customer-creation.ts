import { pgEnum } from "drizzle-orm/pg-core";

export const paymentLinkCustomerCreationEnum = pgEnum("payment_link_customer_creation", ["always", "if_required"]);
