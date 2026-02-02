import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { taxIds } from "../tables/tax-ids";

export type TaxId = InferSelectModel<typeof taxIds>;
export type InsertTaxId = InferInsertModel<typeof taxIds>;
