import { LoginCard, type LoginNotice } from "@/components/auth";
import { getPathname, redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

/**
 * Reads the session before rendering (to send a signed-in visitor on), so it blocks on the server: opted out of
 * Next's instant-navigation validation until it moves to the patterns in the Cache Components auth guide.
 */
export const instant = false;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string | string[]; notice?: string; error?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: true },
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

/** What to say above the form: after confirming the address or a new password, or Auth.js's ?error=. */
const noticeOf = (notice: string | undefined, error: string | undefined): LoginNotice | undefined => {
  if (notice === "confirmed" || notice === "reset") return notice;
  if (error === "OAuthAccountNotLinked") return error;
  return error ? "error" : undefined;
};

const LoginPage = async ({ params, searchParams }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (session) {
    return redirect({ href: "/", locale });
  }

  const { callbackUrl, notice, error } = await searchParams;

  return <LoginCard redirectTo={getRedirectTo(callbackUrl, locale)} notice={noticeOf(notice, error)} />;
};

export default LoginPage;
