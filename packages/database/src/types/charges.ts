import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { charges } from "../tables/charges";

export type Charge = InferSelectModel<typeof charges>;
export type InsertCharge = InferInsertModel<typeof charges>;
