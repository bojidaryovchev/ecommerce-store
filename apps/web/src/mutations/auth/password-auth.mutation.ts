"use server";

import { AccountExistsEmail, ConfirmEmail, ResetPasswordEmail } from "@/emails/account";
import { emailCopy, emailLocale, type EmailLocale } from "@/emails/copy";
import { routing } from "@/i18n/routing";
import { signIn, UnconfirmedEmail } from "@/lib/auth";
import { consumeAuthToken, createAuthToken, peekAuthToken } from "@/lib/auth-tokens";
import { sendEmail } from "@/lib/email";
import { hashPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, verifyPassword } from "@/lib/password";
import { SITE_URL } from "@/lib/site-url";
import { db, schema } from "@ecommerce/database";
import { eq, sql } from "drizzle-orm";
import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";
import React from "react";
import { z } from "zod";

/**
 * Email-and-password accounts: sign in, register (confirmed by a link), forgotten password, new
 * password. Every answer about an address is the same whether or not it has an account; what differs
 * goes to the address itself by email.
 */
export type PasswordFormState = {
  ok?: boolean;
  email?: string;
  errors?: Partial<Record<"name" | "email" | "password" | "token", string>>;
  error?: string;
};

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};
const localeOf = (formData: FormData): EmailLocale => emailLocale(text(formData, "locale"));
const localePrefix = (locale: EmailLocale) => (locale === routing.defaultLocale ? "" : `/${locale}`);
const normalizeEmail = (value: string) => value.trim().toLowerCase();

/** Only same-site paths ("/en/account", not "//evil.com" or "https://…"), to avoid open redirects. */
const safeRedirectPath = (value: string, locale: EmailLocale) =>
  value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : localePrefix(locale) || "/";

const findUser = (email: string) => db.query.users.findFirst({ where: sql`lower(${schema.users.email}) = ${email}` });

const emailSchema = z.email().max(200);
const passwordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH);

async function signInWithPasswordAction(_previous: PasswordFormState, formData: FormData): Promise<PasswordFormState> {
  const locale = localeOf(formData);
  const t = await getTranslations({ locale, namespace: "auth.password" });
  const email = normalizeEmail(text(formData, "email"));
  const password = text(formData, "password");
  if (!emailSchema.safeParse(email).success) return { errors: { email: t("errors.email") } };
  if (!password) return { errors: { password: t("errors.passwordMissing") } };

  try {
    await signIn("password", { email, password, redirectTo: safeRedirectPath(text(formData, "redirectTo"), locale) });
    return { ok: true };
  } catch (error) {
    if (error instanceof UnconfirmedEmail) return { error: t("errors.unconfirmed") };
    if (error instanceof AuthError) {
      return { error: error.type === "CredentialsSignin" ? t("errors.invalid") : t("errors.failed") };
    }
    // Success redirects by throwing; let it through.
    throw error;
  }
}

async function registerAction(_previous: PasswordFormState, formData: FormData): Promise<PasswordFormState> {
  const locale = localeOf(formData);
  const t = await getTranslations({ locale, namespace: "auth.password" });
  const name = text(formData, "name").trim();
  const email = normalizeEmail(text(formData, "email"));
  const password = text(formData, "password");

  const errors: PasswordFormState["errors"] = {};
  if (!name || name.length > 120) errors.name = t("errors.name");
  if (!emailSchema.safeParse(email).success) errors.email = t("errors.email");
  if (!passwordSchema.safeParse(password).success) errors.password = t("errors.password", { min: PASSWORD_MIN_LENGTH });
  if (Object.keys(errors).length > 0) return { errors };

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
    return { error: t("errors.failed") };
  }
}

async function requestPasswordResetAction(
  _previous: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const locale = localeOf(formData);
  const t = await getTranslations({ locale, namespace: "auth.password" });
  const email = normalizeEmail(text(formData, "email"));
  if (!emailSchema.safeParse(email).success) return { errors: { email: t("errors.email") } };

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
    return { error: t("errors.failed") };
  }
}

async function resetPasswordAction(_previous: PasswordFormState, formData: FormData): Promise<PasswordFormState> {
  const locale = localeOf(formData);
  const t = await getTranslations({ locale, namespace: "auth.password" });
  const password = text(formData, "password");
  if (!passwordSchema.safeParse(password).success) {
    return { errors: { password: t("errors.password", { min: PASSWORD_MIN_LENGTH }) } };
  }

  try {
    const email = await consumeAuthToken("reset", text(formData, "token"));
    const user = email ? await findUser(email) : undefined;
    if (!user) return { errors: { token: t("errors.token") } };
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
    return { error: t("errors.failed") };
  }
}

/**
 * The page the confirmation email links to: the address is confirmed by someone who has the inbox
 * (the link) and knows the password chosen at registration, and they are signed in. Asking for the
 * password means a stranger who registered someone else's address cannot have it confirmed for them;
 * the owner, not knowing that password, sets a new one by email instead, which also confirms it.
 */
async function confirmEmailAction(_previous: PasswordFormState, formData: FormData): Promise<PasswordFormState> {
  const locale = localeOf(formData);
  const t = await getTranslations({ locale, namespace: "auth.password" });
  const token = text(formData, "token");
  const password = text(formData, "password");
  if (!password) return { errors: { password: t("errors.passwordMissing") } };

  let email: string;
  try {
    const issuedFor = await peekAuthToken("verify", token);
    const user = issuedFor ? await findUser(issuedFor) : undefined;
    if (!user?.email) return { errors: { token: t("errors.confirmToken") } };
    if (!(await verifyPassword(password, user.passwordHash)))
      return { errors: { password: t("errors.confirmPassword") } };
    await consumeAuthToken("verify", token);
    if (!user.emailVerified) {
      await db
        .update(schema.users)
        .set({ emailVerified: new Date(), updatedAt: new Date() })
        .where(eq(schema.users.id, user.id));
    }
    email = user.email;
  } catch (error) {
    console.error("[auth] Email confirmation failed:", error);
    return { error: t("errors.failed") };
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
