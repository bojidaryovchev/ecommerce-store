import { AuthShell, ConfirmEmailForm } from "@/components/auth";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.verify.metadata" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: false } };
}

/**
 * Opened from the confirmation email. Confirming takes a press of the button rather than happening
 * on opening the page, so mail scanners that open every link cannot use the token up.
 */
const VerifyEmailPage = async ({ params, searchParams }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const [{ token }, t] = await Promise.all([searchParams, getTranslations("auth.verify")]);

  return (
    <AuthShell title={t("title")} description={token ? t("description") : undefined}>
      {token ? <ConfirmEmailForm token={token} /> : <p className="text-destructive text-sm">{t("missing")}</p>}
    </AuthShell>
  );
};

export default VerifyEmailPage;
