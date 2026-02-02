import { pgEnum } from "drizzle-orm/pg-core";

export const refundStatusEnum = pgEnum("refund_status", [
  "pending",
  "requires_action",
  "succeeded",
  "failed",
  "canceled",
]);
