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
import {
  PASSWORD_MIN,
  confirmEmailSchema,
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  signInSchema,
  type AuthErrorKey,
} from "@/schemas/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, MailCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";
import {
  useForm,
  type FieldValues,
  type Path,
  type UseFormRegisterReturn,
  type UseFormSetError,
} from "react-hook-form";
import toast from "react-hot-toast";
import type { z } from "zod";

const field =
  "bg-background focus:border-ring focus:ring-ring/20 w-full rounded-xl border px-3.5 py-2.5 text-[15px] outline-none transition-shadow focus:ring-4 aria-[invalid=true]:border-destructive";
const submit =
  "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 w-full items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors disabled:opacity-60";

/** A message key from the schema or the action, in the visitor's language. */
function useErrorText() {
  const t = useTranslations("auth.password.errors");
  return (key: string | undefined) =>
    key ? (key === "password" ? t("password", { min: PASSWORD_MIN }) : t(key as AuthErrorKey)) : undefined;
}

/**
 * React Hook Form on one of the account schemas. The action checks the same schema again; its field errors
 * land on the fields, and a refusal of the whole form (wrong password, an expired link) shows above the button
 * and as a toast.
 */
function useAuthForm<S extends z.ZodType<FieldValues, FieldValues>>(schema: S, defaultValues: z.input<S>) {
  const form = useForm<z.input<S>>({
    resolver: zodResolver(schema as never),
    mode: "onTouched",
    defaultValues: defaultValues as never,
  });
  const [formError, setFormError] = useState<AuthErrorKey | undefined>();
  const errorText = useErrorText();
  const apply = (state: PasswordFormState, setError: UseFormSetError<z.input<S>>) => {
    for (const [name, key] of Object.entries(state.errors ?? {})) {
      if (name === "token") continue;
      setError(name as Path<z.input<S>>, { message: key }, { shouldFocus: true });
    }
    const whole = state.error ?? state.errors?.token;
    setFormError(whole);
    if (whole) toast.error(errorText(whole) ?? "");
  };
  return { form, formError, apply, errorText };
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

const EmailField: React.FC<{ id: string; error?: string; registration: UseFormRegisterReturn }> = ({
  id,
  error,
  registration,
}) => {
  const t = useTranslations("auth.password.fields");
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {t("email")}
      </label>
      <input
        id={id}
        type="email"
        autoComplete="email"
        maxLength={200}
        {...registration}
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
  registration: UseFormRegisterReturn;
}> = ({ id, label, error, autoComplete, hint, extra, registration }) => {
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
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          maxLength={200}
          {...registration}
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

export const PasswordSignInForm: React.FC<{ redirectTo?: string }> = ({ redirectTo }) => {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { form, formError, apply, errorText } = useAuthForm(signInSchema, { email: "", password: "" });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  const onSubmit = handleSubmit(async (values) => {
    // Success signs in and moves on by redirecting; only a refusal comes back.
    apply(await signInWithPasswordAction({ ...values, locale, ...(redirectTo ? { redirectTo } : {}) }), setError);
  });
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <EmailField id="signin-email" error={errorText(errors.email?.message)} registration={register("email")} />
      <PasswordField
        id="signin-password"
        label={t("password.fields.password")}
        autoComplete="current-password"
        error={errorText(errors.password?.message)}
        registration={register("password")}
        extra={
          <Link href="/forgot-password" className="text-primary text-xs font-medium hover:underline">
            {t("loginCard.forgot")}
          </Link>
        }
      />
      <FormError text={errorText(formError)} />
      <button type="submit" disabled={isSubmitting} className={submit}>
        {isSubmitting ? t("password.signingIn") : t("password.signIn")}
      </button>
    </form>
  );
};

export const RegisterForm: React.FC = () => {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { form, formError, apply, errorText } = useAuthForm(registerSchema, { name: "", email: "", password: "" });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  if (sentTo !== null) {
    return <Done title={t("register.done.title")} text={t("register.done.text", { email: sentTo })} />;
  }
  const onSubmit = handleSubmit(async (values) => {
    const state = await registerAction({ ...values, locale });
    if (state.ok) setSentTo(state.email ?? values.email);
    else apply(state, setError);
  });
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="register-name" className="text-sm font-medium">
          {t("password.fields.name")}
        </label>
        <input
          id="register-name"
          autoComplete="name"
          maxLength={120}
          {...register("name")}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "register-name-error" : undefined}
          className={cn(field, "mt-1.5")}
        />
        <Message id="register-name-error" text={errorText(errors.name?.message)} />
      </div>
      <EmailField id="register-email" error={errorText(errors.email?.message)} registration={register("email")} />
      <PasswordField
        id="register-password"
        label={t("password.fields.password")}
        autoComplete="new-password"
        hint={t("password.fields.passwordHint", { min: PASSWORD_MIN })}
        error={errorText(errors.password?.message)}
        registration={register("password")}
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
      <FormError text={errorText(formError)} />
      <button type="submit" disabled={isSubmitting} className={submit}>
        {isSubmitting ? t("register.sending") : t("register.submit")}
      </button>
    </form>
  );
};

export const ForgotPasswordForm: React.FC = () => {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { form, formError, apply, errorText } = useAuthForm(forgotPasswordSchema, { email: "" });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  if (sentTo !== null) {
    return <Done title={t("forgot.done.title")} text={t("forgot.done.text", { email: sentTo })} />;
  }
  const onSubmit = handleSubmit(async (values) => {
    const state = await requestPasswordResetAction({ ...values, locale });
    if (state.ok) setSentTo(state.email ?? values.email);
    else apply(state, setError);
  });
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <EmailField id="forgot-email" error={errorText(errors.email?.message)} registration={register("email")} />
      <FormError text={errorText(formError)} />
      <button type="submit" disabled={isSubmitting} className={submit}>
        {isSubmitting ? t("forgot.sending") : t("forgot.submit")}
      </button>
    </form>
  );
};

export const ResetPasswordForm: React.FC<{ token: string }> = ({ token }) => {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [done, setDone] = useState(false);
  const { form, formError, apply, errorText } = useAuthForm(resetPasswordSchema, { password: "" });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  if (done) {
    return (
      <Done icon="check" title={t("loginCard.notices.reset")} text="">
        <Link href="/login?notice=reset" className={cn(submit, "mt-6")}>
          {t("password.signIn")}
        </Link>
      </Done>
    );
  }
  const onSubmit = handleSubmit(async (values) => {
    const state = await resetPasswordAction({ ...values, token, locale });
    if (state.ok) setDone(true);
    else apply(state, setError);
  });
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <PasswordField
        id="reset-password"
        label={t("password.fields.newPassword")}
        autoComplete="new-password"
        hint={t("password.fields.passwordHint", { min: PASSWORD_MIN })}
        error={errorText(errors.password?.message)}
        registration={register("password")}
      />
      <FormError text={errorText(formError)} />
      {formError === "token" && (
        <Link href="/forgot-password" className="text-primary block text-sm font-semibold hover:underline">
          {t("forgot.submit")}
        </Link>
      )}
      <button type="submit" disabled={isSubmitting} className={submit}>
        {isSubmitting ? t("reset.sending") : t("reset.submit")}
      </button>
    </form>
  );
};

export const ConfirmEmailForm: React.FC<{ token: string }> = ({ token }) => {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { form, formError, apply, errorText } = useAuthForm(confirmEmailSchema, { password: "" });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  const onSubmit = handleSubmit(async (values) => {
    // Success confirms, signs in and redirects; only a refusal comes back.
    apply(await confirmEmailAction({ ...values, token, locale }), setError);
  });
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <PasswordField
        id="confirm-password"
        label={t("password.fields.password")}
        autoComplete="current-password"
        error={errorText(errors.password?.message)}
        registration={register("password")}
      />
      {errors.password?.message === "confirmPassword" && (
        <Link href="/forgot-password" className="text-primary block text-sm font-semibold hover:underline">
          {t("forgot.submit")}
        </Link>
      )}
      <FormError text={errorText(formError)} />
      {formError === "confirmToken" && (
        <Link href="/login" className="text-primary block text-center text-sm font-semibold hover:underline">
          {t("password.signIn")}
        </Link>
      )}
      <button type="submit" disabled={isSubmitting} className={submit}>
        {isSubmitting ? t("verify.sending") : t("verify.submit")}
      </button>
    </form>
  );
};
