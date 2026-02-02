import { pgEnum } from "drizzle-orm/pg-core";

export const priceBillingSchemeEnum = pgEnum("price_billing_scheme", ["per_unit", "tiered"]);
