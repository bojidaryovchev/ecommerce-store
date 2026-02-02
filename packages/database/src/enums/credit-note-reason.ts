import { pgEnum } from "drizzle-orm/pg-core";

export const creditNoteReasonEnum = pgEnum("credit_note_reason", [
  "duplicate",
  "fraudulent",
  "order_change",
  "product_unsatisfactory",
]);
