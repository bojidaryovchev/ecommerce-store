import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { invoiceLineItems } from "../tables/invoice-line-items";

export type InvoiceLineItem = InferSelectModel<typeof invoiceLineItems>;
export type InsertInvoiceLineItem = InferInsertModel<typeof invoiceLineItems>;
