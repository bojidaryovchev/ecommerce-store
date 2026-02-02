import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { disputes } from "../tables/disputes";

export type Dispute = InferSelectModel<typeof disputes>;
export type InsertDispute = InferInsertModel<typeof disputes>;
