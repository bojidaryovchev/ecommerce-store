import { AuthShell, ForgotPasswordForm } from "@/components/auth";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.forgot.metadata" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: true } };
}

const ForgotPasswordPage = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.forgot");

  return (
    <AuthShell title={t("title")} description={t("description")}>
      <ForgotPasswordForm />
      <p className="text-center text-sm">
        <Link href="/login" className="text-primary font-semibold hover:underline">
          {t("back")}
        </Link>
      </p>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
