"use client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  confirmEmailAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
  signInWithPasswordAction,
  type PasswordFormState,
} from "@/mutations/auth/password-auth.mutation";
import { CheckCircle2, Eye, EyeOff, MailCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { startTransition, useActionState, useState } from "react";

const PASSWORD_MIN = 8;
const field =
  "bg-background focus:border-ring focus:ring-ring/20 w-full rounded-xl border px-3.5 py-2.5 text-[15px] outline-none transition-shadow focus:ring-4 aria-[invalid=true]:border-destructive";
const submit =
  "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 w-full items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors disabled:opacity-60";

type Field = keyof NonNullable<PasswordFormState["errors"]>;

/** Submits by hand rather than through `<form action>`, which would clear the fields on a refusal. */
function usePasswordForm(action: (state: PasswordFormState, data: FormData) => Promise<PasswordFormState>) {
  const [state, dispatch, pending] = useActionState<PasswordFormState, FormData>(action, {});
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  };
  return { state, pending, onSubmit };
}

const Message: React.FC<{ id: string; text?: string }> = ({ id, text }) =>
  text ? (
    <p id={id} className="text-destructive mt-1.5 text-sm">
      {text}
    </p>
  ) : null;

const FormError: React.FC<{ text?: string }> = ({ text }) =>
  text ? (
    <p role="alert" className="bg-destructive/10 text-destructive rounded-xl px-3.5 py-2.5 text-sm">
      {text}
    </p>
  ) : null;

const EmailField: React.FC<{ id: string; error?: string; defaultValue?: string }> = ({ id, error, defaultValue }) => {
  const t = useTranslations("auth.password.fields");
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {t("email")}
      </label>
      <input
        id={id}
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={200}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(field, "mt-1.5")}
      />
      <Message id={`${id}-error`} text={error} />
    </div>
  );
};

const PasswordField: React.FC<{
  id: string;
  label: string;
  error?: string;
  autoComplete: "current-password" | "new-password";
  hint?: string;
  extra?: React.ReactNode;
}> = ({ id, label, error, autoComplete, hint, extra }) => {
  const t = useTranslations("auth.password.fields");
  const [visible, setVisible] = useState(false);
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {extra}
      </div>
      <div className="relative mt-1.5">
        <input
          id={id}
          name="password"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={autoComplete === "new-password" ? PASSWORD_MIN : undefined}
          maxLength={200}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(field, "pr-11")}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? t("hide") : t("show")}
          aria-pressed={visible}
          className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 grid w-11 place-items-center"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-muted-foreground mt-1.5 text-xs">
          {hint}
        </p>
      )}
      <Message id={`${id}-error`} text={error} />
    </div>
  );
};

const Done: React.FC<{ title: string; text: string; icon?: "mail" | "check"; children?: React.ReactNode }> = ({
  title,
  text,
  icon = "mail",
  children,
}) => (
  <div role="status" className="flex flex-col items-center text-center">
    {icon === "mail" ? (
      <MailCheck className="text-heat size-10" aria-hidden />
    ) : (
      <CheckCircle2 className="text-heat size-10" aria-hidden />
    )}
    <h2 className="mt-4 text-xl font-bold">{title}</h2>
    {text && <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{text}</p>}
    {children}
  </div>
);

const err = (state: PasswordFormState, key: Field) => state.errors?.[key];

export const PasswordSignInForm: React.FC<{ redirectTo?: string }> = ({ redirectTo }) => {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { state, pending, onSubmit } = usePasswordForm(signInWithPasswordAction);
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <EmailField id="signin-email" error={err(state, "email")} />
      <PasswordField
        id="signin-password"
        label={t("password.fields.password")}
        autoComplete="current-password"
        error={err(state, "password")}
        extra={
          <Link href="/forgot-password" className="text-primary text-xs font-medium hover:underline">
            {t("loginCard.forgot")}
          </Link>
        }
      />
      <FormError text={state.error} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? t("password.signingIn") : t("password.signIn")}
      </button>
    </form>
  );
};

export const RegisterForm: React.FC = () => {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { state, pending, onSubmit } = usePasswordForm(registerAction);
  if (state.ok) {
    return <Done title={t("register.done.title")} text={t("register.done.text", { email: state.email ?? "" })} />;
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label htmlFor="register-name" className="text-sm font-medium">
          {t("password.fields.name")}
        </label>
        <input
          id="register-name"
          name="name"
          autoComplete="name"
          required
          maxLength={120}
          aria-invalid={Boolean(err(state, "name"))}
          aria-describedby={err(state, "name") ? "register-name-error" : undefined}
          className={cn(field, "mt-1.5")}
        />
        <Message id="register-name-error" text={err(state, "name")} />
      </div>
      <EmailField id="register-email" error={err(state, "email")} />
      <PasswordField
        id="register-password"
        label={t("password.fields.password")}
        autoComplete="new-password"
        hint={t("password.fields.passwordHint", { min: PASSWORD_MIN })}
        error={err(state, "password")}
      />
      <p className="text-muted-foreground text-xs leading-relaxed">
        {t("register.consent")}{" "}
        <Link href="/obshti-usloviya" className="text-primary underline underline-offset-2">
          {t("register.terms")}
        </Link>{" "}
        {t("register.and")}{" "}
        <Link href="/poveritelnost" className="text-primary underline underline-offset-2">
          {t("register.privacy")}
        </Link>
        .
      </p>
      <FormError text={state.error} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? t("register.sending") : t("register.submit")}
      </button>
    </form>
  );
};

export const ForgotPasswordForm: React.FC = () => {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { state, pending, onSubmit } = usePasswordForm(requestPasswordResetAction);
  if (state.ok) {
    return <Done title={t("forgot.done.title")} text={t("forgot.done.text", { email: state.email ?? "" })} />;
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <EmailField id="forgot-email" error={err(state, "email")} />
      <FormError text={state.error} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? t("forgot.sending") : t("forgot.submit")}
      </button>
    </form>
  );
};

export const ResetPasswordForm: React.FC<{ token: string }> = ({ token }) => {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { state, pending, onSubmit } = usePasswordForm(resetPasswordAction);
  if (state.ok) {
    return (
      <Done icon="check" title={t("loginCard.notices.reset")} text="">
        <Link href="/login?notice=reset" className={cn(submit, "mt-6")}>
          {t("password.signIn")}
        </Link>
      </Done>
    );
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      <PasswordField
        id="reset-password"
        label={t("password.fields.newPassword")}
        autoComplete="new-password"
        hint={t("password.fields.passwordHint", { min: PASSWORD_MIN })}
        error={err(state, "password")}
      />
      <FormError text={state.error ?? err(state, "token")} />
      {err(state, "token") && (
        <Link href="/forgot-password" className="text-primary block text-sm font-semibold hover:underline">
          {t("forgot.submit")}
        </Link>
      )}
      <button type="submit" disabled={pending} className={submit}>
        {pending ? t("reset.sending") : t("reset.submit")}
      </button>
    </form>
  );
};

export const ConfirmEmailForm: React.FC<{ token: string }> = ({ token }) => {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { state, pending, onSubmit } = usePasswordForm(confirmEmailAction);
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      <PasswordField
        id="confirm-password"
        label={t("password.fields.password")}
        autoComplete="current-password"
        error={err(state, "password")}
      />
      {err(state, "password") && (
        <Link href="/forgot-password" className="text-primary block text-sm font-semibold hover:underline">
          {t("forgot.submit")}
        </Link>
      )}
      <FormError text={state.error ?? err(state, "token")} />
      {err(state, "token") && (
        <Link href="/login" className="text-primary block text-center text-sm font-semibold hover:underline">
          {t("password.signIn")}
        </Link>
      )}
      <button type="submit" disabled={pending} className={submit}>
        {pending ? t("verify.sending") : t("verify.submit")}
      </button>
    </form>
  );
};
