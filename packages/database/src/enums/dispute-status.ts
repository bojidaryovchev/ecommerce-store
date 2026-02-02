import { pgEnum } from "drizzle-orm/pg-core";

export const disputeStatusEnum = pgEnum("dispute_status", [
  "lost",
  "needs_response",
  "prevented",
  "under_review",
  "warning_closed",
  "warning_needs_response",
  "warning_under_review",
  "won",
]);
