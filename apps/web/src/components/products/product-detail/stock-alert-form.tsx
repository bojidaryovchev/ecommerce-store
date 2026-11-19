"use client";

import { Link } from "@/i18n/navigation";
import { cancelStockAlertAction, requestStockAlertAction } from "@/mutations/stock-alerts";
import { stockAlertSchema, type StockAlertInput } from "@/schemas/stock-alert.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { BellRing, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

type Props = { productId: string };

const field =
  "bg-background focus:border-ring focus:ring-ring/20 aria-[invalid=true]:border-destructive h-11 w-full rounded-xl border px-3.5 text-[15px] transition-shadow outline-none focus:ring-4";

/**
 * Under an out-of-stock product: the visitor leaves an address and is emailed once when it is back
 * (lib/stock-alerts.ts), then the address is deleted. Consent is asked for in so many words, and the request
 * can be withdrawn here. A signed-in customer's address is filled in for them.
 */
const StockAlertForm: React.FC<Props> = ({ productId }) => {
  const t = useTranslations("products.detail.stockAlert");
  const locale = useLocale();
  const { data: session } = useSession();
  // When the form was shown: the action refuses one filled faster than a person could.
  const [startedAt] = useState(() => Date.now());
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StockAlertInput>({
    resolver: zodResolver(stockAlertSchema),
    mode: "onTouched",
    defaultValues: { email: "", consent: false },
    // The signed-in customer's address, once the session is known; what the visitor types wins.
    values: session?.user?.email ? { email: session.user.email, consent: false } : undefined,
    resetOptions: { keepDirtyValues: true },
  });

  const error = (name: "email" | "consent") =>
    errors[name]?.message ? t(`errors.${errors[name]!.message as "email"}`) : undefined;

  const onSubmit = async (values: StockAlertInput, event?: React.BaseSyntheticEvent) => {
    // The field only bots fill, read from the submitted form.
    const form = event?.target instanceof HTMLFormElement ? event.target : null;
    const website = form ? String(new FormData(form).get("website") ?? "") : "";
    const result = await requestStockAlertAction({ ...values, productId, locale, startedAt, website });
    if (result.ok) {
      const email = values.email.trim().toLowerCase();
      toast.success(t("done", { email }));
      setSavedFor(email);
      return;
    }
    for (const [name, key] of Object.entries(result.errors ?? {})) {
      setError(name as keyof StockAlertInput, { message: key }, { shouldFocus: true });
    }
    if (result.error) toast.error(result.error);
  };

  const cancel = async () => {
    if (!savedFor) return;
    const result = await cancelStockAlertAction({ productId, email: savedFor, locale });
    if (result.ok) {
      toast.success(t("cancelled"));
      setSavedFor(null);
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  if (savedFor) {
    return (
      <div className="bg-muted/50 space-y-2 rounded-xl p-4 text-sm" role="status">
        <p className="flex items-start gap-2 font-medium">
          <CheckCircle2 className="text-heat mt-0.5 size-4 shrink-0" aria-hidden />
          {t("done", { email: savedFor })}
        </p>
        <button type="button" onClick={cancel} className="text-primary text-sm font-medium hover:underline">
          {t("cancel")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-muted/50 space-y-3 rounded-xl p-4">
      {/* For bots only: hidden from people and from assistive technology. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div>
        <p className="flex items-center gap-2 font-semibold">
          <BellRing className="text-primary size-4" aria-hidden />
          {t("title")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">{t("text")}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="stock-alert-email" className="sr-only">
            {t("email")}
          </label>
          <input
            id="stock-alert-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("email")}
            {...register("email")}
            aria-invalid={Boolean(error("email"))}
            aria-describedby={error("email") ? "stock-alert-email-error" : undefined}
            className={field}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {isSubmitting ? t("sending") : t("submit")}
        </button>
      </div>
      {error("email") && (
        <p id="stock-alert-email-error" className="text-destructive text-sm">
          {error("email")}
        </p>
      )}
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          {...register("consent")}
          aria-invalid={Boolean(error("consent"))}
          aria-describedby={error("consent") ? "stock-alert-consent-error" : undefined}
          className="accent-primary mt-0.5 size-4 shrink-0"
        />
        <span>
          {t("consent")}{" "}
          <Link href="/poveritelnost" className="text-primary underline underline-offset-2">
            {t("consentLink")}
          </Link>
          .
        </span>
      </label>
      {error("consent") && (
        <p id="stock-alert-consent-error" className="text-destructive text-sm">
          {error("consent")}
        </p>
      )}
    </form>
  );
};

export { StockAlertForm };
