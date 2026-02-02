import { relations } from "drizzle-orm";
import { taxRates } from "../tables/tax-rates";

export const taxRatesRelations = relations(taxRates, () => ({
  // No relations defined yet
}));
