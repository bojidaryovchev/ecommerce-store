"use server";

import { AccountExistsEmail, ConfirmEmail, ResetPasswordEmail } from "@/emails/account";
import { emailCopy, emailLocale, type EmailLocale } from "@/emails/copy";
import { routing } from "@/i18n/routing";
import { signIn, UnconfirmedEmail } from "@/lib/auth";
import { consumeAuthToken, createAuthToken, peekAuthToken } from "@/lib/auth-tokens";
import { sendEmail } from "@/lib/email";
import { hashPassword, verifyPassword } from "@/lib/password";
import { SITE_URL } from "@/lib/site-url";
import {
  confirmEmailSchema,
  fieldErrors,
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  signInSchema,
  type AuthErrorKey,
  type AuthField,
  type ConfirmEmailInput,
  type ForgotPasswordInput,
  type RegisterInput,
  type ResetPasswordInput,
  type SignInInput,
} from "@/schemas/auth.schema";
import { db, schema } from "@ecommerce/database";
import { eq, sql } from "drizzle-orm";
import { AuthError } from "next-auth";
import React from "react";

/**
 * Email-and-password accounts: sign in, register (confirmed by a link), forgotten password, new password.
 * Every answer about an address is the same whether or not it has an account; what differs goes to the address
 * itself by email. The forms validate with the same schemas first; answers are message keys under
 * `auth.password.errors`, which the forms show in the visitor's language.
 */
export type PasswordFormState = {
  ok?: boolean;
  email?: string;
  errors?: Partial<Record<AuthField, AuthErrorKey>>;
  error?: AuthErrorKey;
};

type WithLocale<T> = T & { locale: string };

const localePrefix = (locale: EmailLocale) => (locale === routing.defaultLocale ? "" : `/${locale}`);

/** Only same-site paths ("/en/account", not "//evil.com" or "https://…"), to avoid open redirects. */
const safeRedirectPath = (value: string, locale: EmailLocale) =>
  value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : localePrefix(locale) || "/";

const findUser = (email: string) => db.query.users.findFirst({ where: sql`lower(${schema.users.email}) = ${email}` });

async function signInWithPasswordAction(
  input: WithLocale<SignInInput> & { redirectTo?: string },
): Promise<PasswordFormState> {
  const locale = emailLocale(input.locale);
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { email, password } = parsed.data;

  try {
    await signIn("password", { email, password, redirectTo: safeRedirectPath(input.redirectTo ?? "", locale) });
    return { ok: true };
  } catch (error) {
    if (error instanceof UnconfirmedEmail) return { error: "unconfirmed" };
    if (error instanceof AuthError) return { error: error.type === "CredentialsSignin" ? "invalid" : "failed" };
    // Success redirects by throwing; let it through.
    throw error;
  }
}

async function registerAction(input: WithLocale<RegisterInput>): Promise<PasswordFormState> {
  const locale = emailLocale(input.locale);
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { name, email, password } = parsed.data;

  const copy = emailCopy(locale);
  try {
    const existing = await findUser(email);
    if (existing?.email && !existing.emailVerified && existing.passwordHash) {
      // Registered but never confirmed: send a fresh link. The password stays the one chosen first;
      // confirming asks for it, so whoever confirms must know it (or set a new one by email).
      const token = await createAuthToken("verify", existing.email.toLowerCase());
      await sendEmail({
        to: existing.email,
        subject: copy("account.confirm.subject"),
        react: React.createElement(ConfirmEmail, {
          locale,
          name: existing.name ?? name,
          url: `${SITE_URL}${localePrefix(locale)}/verify-email?token=${token}`,
        }),
      });
      return { ok: true, email };
    }
    if (existing) {
      // Already registered: tell the address, not the visitor.
      await sendEmail({
        to: email,
        subject: copy("account.exists.subject"),
        react: React.createElement(AccountExistsEmail, {
          locale,
          loginUrl: `${SITE_URL}${localePrefix(locale)}/login`,
          resetUrl: `${SITE_URL}${localePrefix(locale)}/forgot-password`,
        }),
      });
      return { ok: true, email };
    }

    await db.insert(schema.users).values({ name, email, passwordHash: await hashPassword(password) });
    const token = await createAuthToken("verify", email);
    await sendEmail({
      to: email,
      subject: copy("account.confirm.subject"),
      react: React.createElement(ConfirmEmail, {
        locale,
        name,
        url: `${SITE_URL}${localePrefix(locale)}/verify-email?token=${token}`,
      }),
    });
    return { ok: true, email };
  } catch (error) {
    console.error("[auth] Registration failed:", error);
    return { error: "failed" };
  }
}

async function requestPasswordResetAction(input: WithLocale<ForgotPasswordInput>): Promise<PasswordFormState> {
  const locale = emailLocale(input.locale);
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { email } = parsed.data;

  try {
    const user = await findUser(email);
    if (user?.email) {
      const token = await createAuthToken("reset", user.email.toLowerCase());
      await sendEmail({
        to: user.email,
        subject: emailCopy(locale)("account.reset.subject"),
        react: React.createElement(ResetPasswordEmail, {
          locale,
          url: `${SITE_URL}${localePrefix(locale)}/reset-password?token=${token}`,
        }),
      });
    }
    return { ok: true, email };
  } catch (error) {
    console.error("[auth] Reset request failed:", error);
    return { error: "failed" };
  }
}

async function resetPasswordAction(
  input: WithLocale<ResetPasswordInput> & { token: string },
): Promise<PasswordFormState> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { password } = parsed.data;

  try {
    const email = await consumeAuthToken("reset", input.token);
    const user = email ? await findUser(email) : undefined;
    if (!user) return { errors: { token: "token" } };
    // The link reached the inbox, which also confirms the address.
    await db
      .update(schema.users)
      .set({
        passwordHash: await hashPassword(password),
        emailVerified: user.emailVerified ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));
    return { ok: true, email: user.email ?? undefined };
  } catch (error) {
    console.error("[auth] Password reset failed:", error);
    return { error: "failed" };
  }
}

/**
 * The page the confirmation email links to: the address is confirmed by someone who has the inbox (the link)
 * and knows the password chosen at registration, and they are signed in. Asking for the password means a
 * stranger who registered someone else's address cannot have it confirmed for them; the owner, not knowing
 * that password, sets a new one by email instead, which also confirms it.
 */
async function confirmEmailAction(
  input: WithLocale<ConfirmEmailInput> & { token: string },
): Promise<PasswordFormState> {
  const locale = emailLocale(input.locale);
  const parsed = confirmEmailSchema.safeParse(input);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { password } = parsed.data;

  let email: string;
  try {
    const issuedFor = await peekAuthToken("verify", input.token);
    const user = issuedFor ? await findUser(issuedFor) : undefined;
    if (!user?.email) return { errors: { token: "confirmToken" } };
    if (!(await verifyPassword(password, user.passwordHash))) return { errors: { password: "confirmPassword" } };
    await consumeAuthToken("verify", input.token);
    if (!user.emailVerified) {
      await db
        .update(schema.users)
        .set({ emailVerified: new Date(), updatedAt: new Date() })
        .where(eq(schema.users.id, user.id));
    }
    email = user.email;
  } catch (error) {
    console.error("[auth] Email confirmation failed:", error);
    return { error: "failed" };
  }
  // Signed in straight away; success redirects by throwing, outside the try above.
  await signIn("password", { email, password, redirectTo: `${localePrefix(locale)}/account` });
  return { ok: true };
}

export {
  confirmEmailAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
  signInWithPasswordAction,
};
