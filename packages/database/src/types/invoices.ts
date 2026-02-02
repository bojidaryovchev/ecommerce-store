import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { invoices } from "../tables/invoices";

export type Invoice = InferSelectModel<typeof invoices>;
export type InsertInvoice = InferInsertModel<typeof invoices>;
