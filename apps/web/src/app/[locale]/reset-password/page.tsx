import { AuthShell, ResetPasswordForm } from "@/components/auth";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React, { Suspense } from "react";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.reset.metadata" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: false } };
}

/** The form for the token in the link; only this part waits for the request. */
const ResetForToken: React.FC<Pick<Props, "searchParams">> = async ({ searchParams }) => {
  const [{ token }, t] = await Promise.all([searchParams, getTranslations("auth")]);
  return token ? (
    <ResetPasswordForm token={token} />
  ) : (
    <>
      <p className="text-destructive text-sm">{t("reset.missing")}</p>
      <Link href="/forgot-password" className="text-primary text-sm font-semibold hover:underline">
        {t("forgot.submit")}
      </Link>
    </>
  );
};

/** Opened from the "new password" email; the token is checked when the form is sent. */
const ResetPasswordPage = async ({ params, searchParams }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <AuthShell title={t("reset.title")} description={t("reset.description")}>
      <Suspense fallback={<div className="h-40" />}>
        <ResetForToken searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
};

export default ResetPasswordPage;
