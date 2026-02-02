import { pgEnum } from "drizzle-orm/pg-core";

export const creditNoteTypeEnum = pgEnum("credit_note_type", ["pre_payment", "post_payment"]);
