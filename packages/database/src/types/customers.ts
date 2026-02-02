import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { customers } from "../tables/customers";

export type Customer = InferSelectModel<typeof customers>;
export type InsertCustomer = InferInsertModel<typeof customers>;
