"use client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { submitWithdrawalAction } from "@/mutations/withdrawal/submit-withdrawal.mutation";
import { withdrawalSchema, type WithdrawalField, type WithdrawalInput } from "@/schemas/withdrawal.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";

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
 * The online withdrawal form: the "confirm withdrawal" step of the withdrawal function. It asks only for what
 * the law lets a trader ask: who, which contract, and where to send the confirmation. React Hook Form with the
 * schema the action checks again, so what was typed stays in place when the action refuses.
 */
const WithdrawalForm: React.FC<Props> = ({ order, name, email, className }) => {
  const t = useTranslations("info.withdrawal");
  const locale = useLocale();
  const [startedAt] = useState(() => Date.now());
  const [done, setDone] = useState<{ email: string; date: string; time: string } | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WithdrawalInput>({
    resolver: zodResolver(withdrawalSchema),
    mode: "onTouched",
    defaultValues: {
      name: name ?? "",
      email: email ?? "",
      order: order ?? "",
      received: "",
      scope: "all",
      items: "",
      note: "",
    },
  });
  const scope = useWatch({ control, name: "scope" });

  if (done) {
    return (
      <div className={cn("bg-card flex flex-col items-start rounded-3xl border p-8 md:p-10", className)} role="status">
        <CheckCircle2 className="text-heat size-10" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold">{t("success.title")}</h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">{t("success.text", done)}</p>
      </div>
    );
  }

  const onSubmit = async (values: WithdrawalInput) => {
    const result = await submitWithdrawalAction({
      ...values,
      locale,
      startedAt,
      website: honeypot.current?.value ?? "",
    });
    if (result.ok) {
      toast.success(t("success.title"));
      setDone({ email: result.email ?? values.email, date: result.date ?? "", time: result.time ?? "" });
      return;
    }
    for (const [key, message] of Object.entries(result.errors ?? {})) {
      setError(key as WithdrawalField, { message }, { shouldFocus: true });
    }
    if (result.error) toast.error(result.error);
  };

  const error = (key: WithdrawalField) =>
    errors[key]?.message ? t(`errors.${errors[key]!.message as WithdrawalField}`) : undefined;
  const required = <span className="text-muted-foreground text-xs font-normal">({t("required")})</span>;
  const invalid = (key: WithdrawalField, hint?: string) => ({
    "aria-invalid": Boolean(error(key)),
    "aria-describedby": [error(key) && `withdrawal-${key}-error`, hint].filter(Boolean).join(" ") || undefined,
  });
  const message = (key: WithdrawalField) =>
    error(key) && (
      <p id={`withdrawal-${key}-error`} className="text-destructive mt-1.5 text-sm">
        {error(key)}
      </p>
    );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={cn("bg-card rounded-3xl border p-6 shadow-sm md:p-8", className)}
    >
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="withdrawal-name" className={label}>
            {t("fields.name")} {required}
          </label>
          <input
            id="withdrawal-name"
            autoComplete="name"
            maxLength={120}
            {...register("name")}
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
            type="email"
            autoComplete="email"
            maxLength={200}
            {...register("email")}
            {...invalid("email", "withdrawal-email-hint")}
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
            maxLength={100}
            autoComplete="off"
            {...register("order")}
            {...invalid("order", "withdrawal-order-hint")}
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
            type="date"
            {...register("received")}
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
              <input type="radio" value={value} {...register("scope")} className="accent-primary" />
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
            rows={3}
            maxLength={2000}
            {...register("items")}
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
          rows={3}
          maxLength={2000}
          {...register("note")}
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-heat text-heat-foreground hover:bg-heat/90 mt-6 inline-flex h-12 w-full items-center justify-center rounded-full px-8 text-sm font-semibold transition-colors disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? t("sending") : t("submit")}
      </button>
    </form>
  );
};

export { WithdrawalForm };
