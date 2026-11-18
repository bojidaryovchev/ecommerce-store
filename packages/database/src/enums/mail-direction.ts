import { pgEnum } from "drizzle-orm/pg-core";

/** "in": a message someone sent to the shop's mailbox. "out": one the shop sent from the admin panel. */
export const mailDirectionEnum = pgEnum("mail_direction", ["in", "out"]);
