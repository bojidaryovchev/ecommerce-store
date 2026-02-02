import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { taxRates } from "../tables/tax-rates";

export type TaxRate = InferSelectModel<typeof taxRates>;
export type InsertTaxRate = InferInsertModel<typeof taxRates>;
