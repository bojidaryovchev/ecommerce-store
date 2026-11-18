import { productEnrichments } from "../tables/product-enrichments";

export type ProductEnrichment = typeof productEnrichments.$inferSelect;
export type NewProductEnrichment = typeof productEnrichments.$inferInsert;
