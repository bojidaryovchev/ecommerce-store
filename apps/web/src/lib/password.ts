import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Password hashing with scrypt (built into Node, so no native dependency). Stored as
 * "scrypt$N$r$p$salt$hash" so the cost can be raised later without breaking old hashes.
 */
const COST = { N: 16384, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

/** The same limits the account forms check (schemas/auth.schema.ts). */
export { PASSWORD_MAX as PASSWORD_MAX_LENGTH, PASSWORD_MIN as PASSWORD_MIN_LENGTH } from "@/schemas/auth.schema";

const derive = (password: string, salt: Buffer, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { ...options, maxmem: MAX_MEMORY }, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, COST);
  return ["scrypt", COST.N, COST.r, COST.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

/** A hash of nothing, checked when there is no account, so a missing account takes as long as a wrong password. */
let decoy: Promise<string> | null = null;

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  const hash = stored ?? (await (decoy ??= hashPassword(randomBytes(12).toString("hex"))));
  const [algorithm, n, r, p, salt, key] = hash.split("$");
  if (algorithm !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64url");
  const actual = await derive(password, Buffer.from(salt, "base64url"), { N: Number(n), r: Number(r), p: Number(p) });
  return Boolean(stored) && actual.length === expected.length && timingSafeEqual(actual, expected);
}
