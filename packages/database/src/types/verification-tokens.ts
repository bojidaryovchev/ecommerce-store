import { verificationTokens } from "../tables/verification-tokens";

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
