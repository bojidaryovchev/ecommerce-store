import { AuthShell, RegisterForm } from "@/components/auth";
import { Link, redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.register.metadata" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: true } };
}

const RegisterPage = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await auth()) return redirect({ href: "/account", locale });
  const t = await getTranslations("auth.register");

  return (
    <AuthShell title={t("title")} description={t("description")}>
      <RegisterForm />
      <p className="text-muted-foreground text-center text-sm">
        {t("haveAccount")}{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </AuthShell>
  );
};

export default RegisterPage;
