"use client";

import { Link } from "@/i18n/navigation";
import { INSTALLATION_SYSTEMS } from "@/lib/installation-systems";
import { cn } from "@/lib/utils";
import { submitContactAction, type ContactFormState } from "@/mutations/contact/submit-contact.mutation";
import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { startTransition, useActionState, useState } from "react";

type Props = {
  topic?: "ogled" | "vapros";
  system?: string;
  className?: string;
};

const SYSTEMS = [...INSTALLATION_SYSTEMS.map((system) => system.slug), "drugo"];

const field =
  "bg-background focus:border-ring focus:ring-ring/20 w-full rounded-xl border px-3.5 py-2.5 text-[15px] outline-none transition-shadow focus:ring-4 aria-[invalid=true]:border-destructive";
const label = "text-sm font-medium";

/**
 * The contact and site-visit form. Submitted by hand rather than through `<form action>`, which
 * would clear the fields when the action returns: a refusal must leave what was typed in place.
 */
const ContactForm: React.FC<Props> = ({ topic: initialTopic = "vapros", system: initialSystem, className }) => {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [state, dispatch, pending] = useActionState<ContactFormState, FormData>(submitContactAction, {});
  const [topic, setTopic] = useState(initialTopic);
  // When the page was opened: the action refuses forms filled faster than a person could.
  const [startedAt] = useState(() => Date.now());

  if (state.ok) {
    return (
      <div className={cn("bg-card flex flex-col items-start rounded-3xl border p-8 md:p-10", className)} role="status">
        <CheckCircle2 className="text-heat size-10" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold">{t("success.title")}</h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">{t("success.text", { email: state.email ?? "" })}</p>
      </div>
    );
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  };
  const error = (key: keyof NonNullable<ContactFormState["errors"]>) => state.errors?.[key];

  return (
    <form onSubmit={onSubmit} noValidate className={cn("bg-card rounded-3xl border p-6 shadow-sm md:p-8", className)}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="startedAt" value={startedAt} />
      {/* For bots only: hidden from people and from assistive technology. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset>
        <legend className={label}>{t("form.topic")}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(["ogled", "vapros"] as const).map((value) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                topic === value ? "border-primary bg-primary/5 font-medium" : "hover:border-primary/30",
              )}
            >
              <input
                type="radio"
                name="topic"
                value={value}
                checked={topic === value}
                onChange={() => setTopic(value)}
                className="accent-primary"
              />
              {t(`form.topics.${value}`)}
            </label>
          ))}
        </div>
      </fieldset>

      {topic === "ogled" && (
        <div className="mt-5">
          <label htmlFor="contact-system" className={label}>
            {t("form.system")}
          </label>
          <select id="contact-system" name="system" defaultValue={initialSystem ?? ""} className={cn(field, "mt-1.5")}>
            <option value="">—</option>
            {SYSTEMS.map((slug) => (
              <option key={slug} value={slug}>
                {t(`form.systems.${slug}`)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={label}>
            {t("form.name")} <span className="text-muted-foreground text-xs font-normal">({t("form.required")})</span>
          </label>
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            aria-invalid={Boolean(error("name"))}
            aria-describedby={error("name") ? "contact-name-error" : undefined}
            className={cn(field, "mt-1.5")}
          />
          {error("name") && (
            <p id="contact-name-error" className="text-destructive mt-1.5 text-sm">
              {error("name")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="contact-email" className={label}>
            {t("form.email")} <span className="text-muted-foreground text-xs font-normal">({t("form.required")})</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={200}
            aria-invalid={Boolean(error("email"))}
            aria-describedby={error("email") ? "contact-email-error" : undefined}
            className={cn(field, "mt-1.5")}
          />
          {error("email") && (
            <p id="contact-email-error" className="text-destructive mt-1.5 text-sm">
              {error("email")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="contact-phone" className={label}>
            {t("form.phone")}
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            aria-describedby="contact-phone-hint"
            className={cn(field, "mt-1.5")}
          />
          <p id="contact-phone-hint" className="text-muted-foreground mt-1.5 text-xs">
            {t("form.phoneHint")}
          </p>
        </div>
        <div>
          <label htmlFor="contact-city" className={label}>
            {t("form.city")}
          </label>
          <input
            id="contact-city"
            name="city"
            autoComplete="address-level2"
            maxLength={100}
            className={cn(field, "mt-1.5")}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-message" className={label}>
          {t("form.message")}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          maxLength={4000}
          placeholder={t("form.messagePlaceholder")}
          aria-invalid={Boolean(error("message"))}
          aria-describedby={error("message") ? "contact-message-error" : undefined}
          className={cn(field, "mt-1.5 resize-y")}
        />
        {error("message") && (
          <p id="contact-message-error" className="text-destructive mt-1.5 text-sm">
            {error("message")}
          </p>
        )}
      </div>

      <div className="mt-5">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={Boolean(error("consent"))}
            className="accent-primary mt-0.5 size-4 shrink-0"
          />
          <span>
            {t("form.consent")}{" "}
            <Link href="/poveritelnost" className="text-primary underline underline-offset-2">
              {t("form.consentLink")}
            </Link>
            .
          </span>
        </label>
        {error("consent") && <p className="text-destructive mt-1.5 text-sm">{error("consent")}</p>}
      </div>

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
        {pending ? t("form.sending") : t("form.submit")}
      </button>
    </form>
  );
};

export { ContactForm };
