import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { invoiceItems } from "../tables/invoice-items";

export type InvoiceItem = InferSelectModel<typeof invoiceItems>;
export type InsertInvoiceItem = InferInsertModel<typeof invoiceItems>;
