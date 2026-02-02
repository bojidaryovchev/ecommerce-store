import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { discounts } from "../tables/discounts";

export type Discount = InferSelectModel<typeof discounts>;
export type InsertDiscount = InferInsertModel<typeof discounts>;
