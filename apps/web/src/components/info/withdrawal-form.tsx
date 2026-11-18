"use client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { submitWithdrawalAction, type WithdrawalFormState } from "@/mutations/withdrawal/submit-withdrawal.mutation";
import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { startTransition, useActionState, useState } from "react";

type Props = {
  /** Filled in when the form is opened from an order. */
  order?: string;
  name?: string;
  email?: string;
  className?: string;
};

const field =
  "bg-background focus:border-ring focus:ring-ring/20 w-full rounded-xl border px-3.5 py-2.5 text-[15px] outline-none transition-shadow focus:ring-4 aria-[invalid=true]:border-destructive";
const label = "text-sm font-medium";

/**
 * The online withdrawal form: the "confirm withdrawal" step of the withdrawal function. It asks only
 * for what the law lets a trader ask: who, which contract, and where to send the confirmation.
 * Submitted by hand so a refusal leaves what was typed in place.
 */
const WithdrawalForm: React.FC<Props> = ({ order, name, email, className }) => {
  const t = useTranslations("info.withdrawal");
  const locale = useLocale();
  const [state, dispatch, pending] = useActionState<WithdrawalFormState, FormData>(submitWithdrawalAction, {});
  const [scope, setScope] = useState<"all" | "part">("all");
  const [startedAt] = useState(() => Date.now());

  if (state.ok) {
    return (
      <div className={cn("bg-card flex flex-col items-start rounded-3xl border p-8 md:p-10", className)} role="status">
        <CheckCircle2 className="text-heat size-10" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold">{t("success.title")}</h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          {t("success.text", { date: state.date ?? "", time: state.time ?? "", email: state.email ?? "" })}
        </p>
      </div>
    );
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  };
  const error = (key: keyof NonNullable<WithdrawalFormState["errors"]>) => state.errors?.[key];
  const required = <span className="text-muted-foreground text-xs font-normal">({t("required")})</span>;
  const invalid = (key: keyof NonNullable<WithdrawalFormState["errors"]>) => ({
    "aria-invalid": Boolean(error(key)),
    "aria-describedby": error(key) ? `withdrawal-${key}-error` : undefined,
  });
  const message = (key: keyof NonNullable<WithdrawalFormState["errors"]>) =>
    error(key) && (
      <p id={`withdrawal-${key}-error`} className="text-destructive mt-1.5 text-sm">
        {error(key)}
      </p>
    );

  return (
    <form onSubmit={onSubmit} noValidate className={cn("bg-card rounded-3xl border p-6 shadow-sm md:p-8", className)}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="withdrawal-name" className={label}>
            {t("fields.name")} {required}
          </label>
          <input
            id="withdrawal-name"
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            defaultValue={name}
            {...invalid("name")}
            className={cn(field, "mt-1.5")}
          />
          {message("name")}
        </div>
        <div>
          <label htmlFor="withdrawal-email" className={label}>
            {t("fields.email")} {required}
          </label>
          <input
            id="withdrawal-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={200}
            defaultValue={email}
            aria-invalid={Boolean(error("email"))}
            aria-describedby={error("email") ? "withdrawal-email-error withdrawal-email-hint" : "withdrawal-email-hint"}
            className={cn(field, "mt-1.5")}
          />
          <p id="withdrawal-email-hint" className="text-muted-foreground mt-1.5 text-xs">
            {t("fields.emailHint")}
          </p>
          {message("email")}
        </div>
        <div>
          <label htmlFor="withdrawal-order" className={label}>
            {t("fields.order")} {required}
          </label>
          <input
            id="withdrawal-order"
            name="order"
            required
            maxLength={100}
            defaultValue={order}
            autoComplete="off"
            aria-invalid={Boolean(error("order"))}
            aria-describedby={error("order") ? "withdrawal-order-error withdrawal-order-hint" : "withdrawal-order-hint"}
            className={cn(field, "mt-1.5 font-mono uppercase placeholder:normal-case")}
          />
          <p id="withdrawal-order-hint" className="text-muted-foreground mt-1.5 text-xs">
            {t("fields.orderHint")}
          </p>
          {message("order")}
        </div>
        <div>
          <label htmlFor="withdrawal-received" className={label}>
            {t("fields.received")}
          </label>
          <input
            id="withdrawal-received"
            name="received"
            type="date"
            aria-describedby="withdrawal-received-hint"
            className={cn(field, "mt-1.5")}
          />
          <p id="withdrawal-received-hint" className="text-muted-foreground mt-1.5 text-xs">
            {t("fields.receivedHint")}
          </p>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className={label}>{t("fields.scope")}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(["all", "part"] as const).map((value) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                scope === value ? "border-primary bg-primary/5 font-medium" : "hover:border-primary/30",
              )}
            >
              <input
                type="radio"
                name="scope"
                value={value}
                checked={scope === value}
                onChange={() => setScope(value)}
                className="accent-primary"
              />
              {value === "all" ? t("fields.scopeAll") : t("fields.scopePart")}
            </label>
          ))}
        </div>
      </fieldset>

      {scope === "part" && (
        <div className="mt-5">
          <label htmlFor="withdrawal-items" className={label}>
            {t("fields.items")} {required}
          </label>
          <textarea
            id="withdrawal-items"
            name="items"
            rows={3}
            maxLength={2000}
            {...invalid("items")}
            className={cn(field, "mt-1.5 resize-y")}
          />
          {message("items")}
        </div>
      )}

      <div className="mt-5">
        <label htmlFor="withdrawal-note" className={label}>
          {t("fields.note")}
        </label>
        <textarea
          id="withdrawal-note"
          name="note"
          rows={3}
          maxLength={2000}
          aria-describedby="withdrawal-note-hint"
          className={cn(field, "mt-1.5 resize-y")}
        />
        <p id="withdrawal-note-hint" className="text-muted-foreground mt-1.5 text-xs">
          {t("fields.noteHint")}
        </p>
      </div>

      <p className="text-muted-foreground mt-5 text-sm">
        {t("privacy")}{" "}
        <Link href="/poveritelnost" className="text-primary underline underline-offset-2">
          {t("privacyLink")}
        </Link>
        .
      </p>

      {state.error && (
        <p role="alert" className="text-destructive mt-5 text-sm">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-heat text-heat-foreground hover:bg-heat/90 mt-6 inline-flex h-12 w-full items-center justify-center rounded-full px-8 text-sm font-semibold transition-colors disabled:opacity-60 sm:w-auto"
      >
        {pending ? t("sending") : t("submit")}
      </button>
    </form>
  );
};

export { WithdrawalForm };
