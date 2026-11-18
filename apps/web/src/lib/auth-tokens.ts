import { db, schema } from "@ecommerce/database";
import { and, eq, gt, like } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";

/**
 * One-time links for email-and-password accounts: confirming the address, and setting a new password.
 * Only a hash of each token is stored, so the table alone cannot be used to take over an account.
 * The identifier is "<purpose>:<email>"; a new link replaces any earlier one for the same purpose.
 */
export type TokenPurpose = "verify" | "reset";

const LIFETIME: Record<TokenPurpose, number> = {
  verify: 48 * 60 * 60 * 1000,
  reset: 60 * 60 * 1000,
};

const digest = (token: string) => createHash("sha256").update(token).digest("base64url");

export async function createAuthToken(purpose: TokenPurpose, email: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const identifier = `${purpose}:${email}`;
  await db.transaction(async (tx) => {
    await tx.delete(schema.verificationTokens).where(eq(schema.verificationTokens.identifier, identifier));
    await tx.insert(schema.verificationTokens).values({
      identifier,
      token: digest(token),
      expires: new Date(Date.now() + LIFETIME[purpose]),
    });
  });
  return token;
}

/** The email a still-valid token was issued for, without using it up; null when it is unknown, used or expired. */
export async function peekAuthToken(purpose: TokenPurpose, token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const [row] = await db
    .select({ identifier: schema.verificationTokens.identifier })
    .from(schema.verificationTokens)
    .where(
      and(
        eq(schema.verificationTokens.token, digest(token)),
        like(schema.verificationTokens.identifier, `${purpose}:%`),
        gt(schema.verificationTokens.expires, new Date()),
      ),
    )
    .limit(1);
  return row ? row.identifier.slice(purpose.length + 1) : null;
}

/** The email a still-valid token was issued for, using the token up; null when it is unknown, used or expired. */
export async function consumeAuthToken(purpose: TokenPurpose, token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const [row] = await db
    .delete(schema.verificationTokens)
    .where(
      and(
        eq(schema.verificationTokens.token, digest(token)),
        like(schema.verificationTokens.identifier, `${purpose}:%`),
        gt(schema.verificationTokens.expires, new Date()),
      ),
    )
    .returning({ identifier: schema.verificationTokens.identifier });
  return row ? row.identifier.slice(purpose.length + 1) : null;
}
