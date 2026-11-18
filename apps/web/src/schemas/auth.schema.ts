import { z } from "zod";

/**
 * Email-and-password accounts: one schema per form, checked by React Hook Form in the browser and again in the
 * server action. Each message is a key under `auth.password.errors`, shown in the visitor's language.
 */

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 200;

/** Lowercase and trimmed: addresses are compared that way. */
const email = z.string().trim().toLowerCase().max(200, "email").pipe(z.email("email"));
const newPassword = z.string().min(PASSWORD_MIN, "password").max(PASSWORD_MAX, "password");
const currentPassword = z.string().min(1, "passwordMissing").max(PASSWORD_MAX, "passwordMissing");

export const signInSchema = z.object({ email, password: currentPassword });
export const registerSchema = z.object({
  name: z.string().trim().min(1, "name").max(120, "name"),
  email,
  password: newPassword,
});
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({ password: newPassword });
export const confirmEmailSchema = z.object({ password: currentPassword });

export type SignInInput = z.input<typeof signInSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type ConfirmEmailInput = z.input<typeof confirmEmailSchema>;

/** The keys of every message these forms can show. */
export type AuthErrorKey =
  | "email"
  | "passwordMissing"
  | "invalid"
  | "unconfirmed"
  | "name"
  | "password"
  | "token"
  | "confirmToken"
  | "failed"
  | "confirmPassword";

export type AuthField = "name" | "email" | "password" | "token";

/** The first message per field of a failed parse, for the action's answer. */
export function fieldErrors(error: z.ZodError): Partial<Record<AuthField, AuthErrorKey>> {
  const errors: Partial<Record<AuthField, AuthErrorKey>> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0]) as AuthField;
    errors[field] ??= issue.message as AuthErrorKey;
  }
  return errors;
}
