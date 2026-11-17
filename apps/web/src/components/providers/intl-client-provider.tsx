"use client";

/**
 * next-intl's client provider, imported from a client module so it receives only the props we pass.
 * (Its server wrapper would look up formats, time zone and "now" from the request, which blocks
 * prerendering under Cache Components.)
 */
export { NextIntlClientProvider as IntlClientProvider } from "next-intl";
