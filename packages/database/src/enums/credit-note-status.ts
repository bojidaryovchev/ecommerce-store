import { pgEnum } from "drizzle-orm/pg-core";

export const creditNoteStatusEnum = pgEnum("credit_note_status", ["issued", "void"]);
