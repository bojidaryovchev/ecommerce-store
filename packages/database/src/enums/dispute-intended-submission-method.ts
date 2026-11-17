import { pgEnum } from "drizzle-orm/pg-core";

export const disputeIntendedSubmissionMethodEnum = pgEnum("dispute_intended_submission_method", [
  "manual",
  "prefer_manual",
  "prefer_smart_disputes",
  "smart_disputes",
]);
