"use client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { submitContactAction } from "@/mutations/contact/submit-contact.mutation";
import { CONTACT_SYSTEMS, contactSchema, type ContactInput } from "@/schemas/contact.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";

type Props = {
  topic?: "ogled" | "vapros";
  system?: string;
  /** The product the question is about, when the form is opened from a product page. */
  product?: { slug: string; name: string };
  className?: string;
};

const field =
  "bg-background focus:border-ring focus:ring-ring/20 w-full rounded-xl border px-3.5 py-2.5 text-[15px] outline-none transition-shadow focus:ring-4 aria-[invalid=true]:border-destructive";
const label = "text-sm font-medium";

/**
 * The contact and site-visit form: React Hook Form with the same Zod schema the action checks, so a mistake
 * shows at the field as soon as it is left, and what was typed stays in place when the action refuses.
 */
const ContactForm: React.FC<Props> = ({
  topic: initialTopic = "vapros",
  system: initialSystem,
  product,
  className,
}) => {
  const t = useTranslations("contact");
  const locale = useLocale();
  // When the page was opened: the action refuses forms filled faster than a person could.
  const [startedAt] = useState(() => Date.now());
  const [sentTo, setSentTo] = useState<string | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: {
      topic: initialTopic,
      system: (CONTACT_SYSTEMS as readonly string[]).includes(initialSystem ?? "")
        ? (initialSystem as ContactInput["system"])
        : "",
      name: "",
      email: "",
      phone: "",
      city: "",
      message: "",
      consent: false,
    },
  });
  const topic = useWatch({ control, name: "topic" });

  if (sentTo !== null) {
    return (
      <div className={cn("bg-card flex flex-col items-start rounded-3xl border p-8 md:p-10", className)} role="status">
        <CheckCircle2 className="text-heat size-10" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold">{t("success.title")}</h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">{t("success.text", { email: sentTo })}</p>
      </div>
    );
  }

  const onSubmit = async (values: ContactInput) => {
    const result = await submitContactAction({
      ...values,
      locale,
      startedAt,
      website: honeypot.current?.value ?? "",
      ...(product ? { product: product.slug } : {}),
    });
    if (result.ok) {
      toast.success(t("success.title"));
      setSentTo(result.email ?? values.email);
      return;
    }
    for (const [name, key] of Object.entries(result.errors ?? {})) {
      setError(name as keyof ContactInput, { message: key }, { shouldFocus: true });
    }
    if (result.error) toast.error(result.error);
  };
  /** The message for a field's error, in the visitor's language (the schema gives keys). */
  const error = (name: "name" | "email" | "message" | "consent") =>
    errors[name]?.message ? t(`errors.${errors[name]!.message as "name"}`) : undefined;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={cn("bg-card rounded-3xl border p-6 shadow-sm md:p-8", className)}
    >
      {/* For bots only: hidden from people and from assistive technology. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
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
              <input type="radio" value={value} {...register("topic")} className="accent-primary" />
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
          <select id="contact-system" {...register("system")} className={cn(field, "mt-1.5")}>
            <option value="">—</option>
            {CONTACT_SYSTEMS.map((slug) => (
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
            autoComplete="name"
            maxLength={120}
            {...register("name")}
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
            type="email"
            autoComplete="email"
            maxLength={200}
            {...register("email")}
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
            type="tel"
            autoComplete="tel"
            maxLength={40}
            {...register("phone")}
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
            autoComplete="address-level2"
            maxLength={100}
            {...register("city")}
            className={cn(field, "mt-1.5")}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-message" className={label}>
          {t("form.message")}
        </label>
        {product && (
          <p className="bg-muted/60 mt-1.5 rounded-lg px-3 py-2 text-sm">
            <span className="text-muted-foreground">{t("form.about")}:</span>{" "}
            <span className="font-medium">{product.name}</span>
          </p>
        )}
        <textarea
          id="contact-message"
          rows={6}
          maxLength={4000}
          placeholder={t("form.messagePlaceholder")}
          {...register("message")}
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
            {...register("consent")}
            aria-invalid={Boolean(error("consent"))}
            aria-describedby={error("consent") ? "contact-consent-error" : undefined}
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
        {error("consent") && (
          <p id="contact-consent-error" className="text-destructive mt-1.5 text-sm">
            {error("consent")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-heat text-heat-foreground hover:bg-heat/90 mt-6 inline-flex h-12 w-full items-center justify-center rounded-full px-8 text-sm font-semibold transition-colors disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? t("form.sending") : t("form.submit")}
      </button>
    </form>
  );
};

export { ContactForm };
