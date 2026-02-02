import { pgEnum } from "drizzle-orm/pg-core";

export const customerTaxExemptEnum = pgEnum("customer_tax_exempt", ["none", "exempt", "reverse"]);
