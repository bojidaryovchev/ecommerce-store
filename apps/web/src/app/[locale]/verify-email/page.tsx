import { AuthShell, ConfirmEmailForm } from "@/components/auth";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React, { Suspense } from "react";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.verify.metadata" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: false } };
}

/** The form for the token in the link; only this part waits for the request. */
const ConfirmForToken: React.FC<Pick<Props, "searchParams">> = async ({ searchParams }) => {
  const [{ token }, t] = await Promise.all([searchParams, getTranslations("auth.verify")]);
  return token ? <ConfirmEmailForm token={token} /> : <p className="text-destructive text-sm">{t("missing")}</p>;
};

/**
 * Opened from the confirmation email. Confirming takes the registration password and a press of the
 * button rather than happening on opening the page, so mail scanners that open every link cannot use
 * the token up.
 */
const VerifyEmailPage = async ({ params, searchParams }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.verify");

  return (
    <AuthShell title={t("title")} description={t("description")}>
      <Suspense fallback={<div className="h-40" />}>
        <ConfirmForToken searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
};

export default VerifyEmailPage;
