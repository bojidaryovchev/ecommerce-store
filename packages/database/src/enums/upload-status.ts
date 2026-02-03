import { pgEnum } from "drizzle-orm/pg-core";

export const uploadStatusEnum = pgEnum("upload_status", ["pending", "linked", "deleted"]);
