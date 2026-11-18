import { pgEnum } from "drizzle-orm/pg-core";

/** "done" is set by hand from the admin panel; any new message in the conversation opens it again. */
export const mailThreadStatusEnum = pgEnum("mail_thread_status", ["open", "done"]);
