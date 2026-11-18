import { AuthShell, ResetPasswordForm } from "@/components/auth";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.reset.metadata" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: false } };
}

/** Opened from the "new password" email; the token is checked when the form is sent. */
const ResetPasswordPage = async ({ params, searchParams }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const [{ token }, t] = await Promise.all([searchParams, getTranslations("auth")]);

  return (
    <AuthShell title={t("reset.title")} description={t("reset.description")}>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <p className="text-destructive text-sm">{t("reset.missing")}</p>
          <Link href="/forgot-password" className="text-primary text-sm font-semibold hover:underline">
            {t("forgot.submit")}
          </Link>
        </>
      )}
    </AuthShell>
  );
};

export default ResetPasswordPage;
