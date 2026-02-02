import { relations } from "drizzle-orm";
import { paymentLinks } from "../tables";

export const paymentLinksRelations = relations(paymentLinks, () => ({}));
