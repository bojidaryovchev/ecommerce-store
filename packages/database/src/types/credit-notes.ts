import type { creditNotes } from "../tables/credit-notes";

export type CreditNote = typeof creditNotes.$inferSelect;
export type InsertCreditNote = typeof creditNotes.$inferInsert;
