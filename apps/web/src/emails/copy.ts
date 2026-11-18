import { SITE_URL } from "@/lib/site-url";
import { createTranslator } from "next-intl";
import bg from "../../messages/bg/emails.json";
import bgNavigation from "../../messages/bg/navigation.json";
import en from "../../messages/en/emails.json";
import enNavigation from "../../messages/en/navigation.json";

/**
 * The words of the transactional emails, in the customer's language. Emails are sent outside a page
 * request (Stripe's webhook, an admin action), so their copy is loaded here rather than through the
 * request's messages, and never shipped to the browser.
 */
export type EmailLocale = "bg" | "en";

/** The order's language, Bulgarian unless English was recorded. */
export const emailLocale = (value: unknown): EmailLocale => (value === "en" ? "en" : "bg");

export function emailCopy(locale: EmailLocale) {
  return createTranslator({
    locale,
    messages: { emails: (locale === "en" ? en : bg) as typeof bg },
    namespace: "emails",
  });
}

export type EmailCopy = ReturnType<typeof emailCopy>;

export const emailBrand = (locale: EmailLocale) =>
  locale === "en" ? enNavigation.navbar.brand : bgNavigation.navbar.brand;
export const emailTagline = (locale: EmailLocale) =>
  locale === "en" ? "Heating and cooling" : "Отопление и климатизация";

/** Money as the customer reads it: "3 740,00 €" in Bulgarian. */
export const emailMoney = (locale: EmailLocale, amount: number, currency: string) =>
  new Intl.NumberFormat(locale === "en" ? "en-GB" : "bg-BG", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);

/** An absolute link to a page of the site in the customer's language. */
export const emailLink = (locale: EmailLocale, path: string) => `${SITE_URL}${locale === "en" ? "/en" : ""}${path}`;

/** How an order is named to the customer: the first eight characters, upper-case. */
export const orderNumber = (orderId: string) => orderId.slice(0, 8).toUpperCase();
