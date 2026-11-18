import { mailThreads } from "../tables/mail-threads";

export type MailThread = typeof mailThreads.$inferSelect;
export type NewMailThread = typeof mailThreads.$inferInsert;
export type MailThreadStatus = MailThread["status"];
export type MailDirection = MailThread["lastMessageDirection"];
