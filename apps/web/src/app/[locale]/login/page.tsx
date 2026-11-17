import { LoginCard } from "@/components/auth";
import { getPathname, redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

/**
 * Where to go after Google sign-in. The proxy sends signed-out visitors here with `?callbackUrl=<the page they asked
 * for>`, already locale-prefixed ("/en/account/orders"). Only same-site paths are accepted ("//host" and "/\host"
 * are not); otherwise return to the home page of the current locale ("/" or "/en").
 */
const getRedirectTo = (callbackUrl: string | string[] | undefined, locale: string) =>
  typeof callbackUrl === "string" && /^\/(?![/\\])/.test(callbackUrl)
    ? callbackUrl
    : getPathname({ href: "/", locale });

const LoginPage = async ({ params, searchParams }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (session) {
    return redirect({ href: "/", locale });
  }

  const { callbackUrl } = await searchParams;

  return (
    <main className="max-w-container flex min-h-[60vh] items-center justify-center py-16">
      <LoginCard redirectTo={getRedirectTo(callbackUrl, locale)} />
    </main>
  );
};

export default LoginPage;
