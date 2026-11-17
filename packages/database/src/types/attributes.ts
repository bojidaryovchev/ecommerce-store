import { attributes } from "../tables/attributes";

export type Attribute = typeof attributes.$inferSelect;
export type NewAttribute = typeof attributes.$inferInsert;
