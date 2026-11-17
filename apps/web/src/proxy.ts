import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { UserRole } from "@ecommerce/database/schema";
import { NextAuthRequest } from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { setSecurityHeaders } from "./lib/headers";

const intlMiddleware = createIntlMiddleware(routing);

/** "/en/account/orders" → { prefix: "/en", path: "/account/orders" }; Bulgarian URLs have no prefix. */
const splitLocalePrefix = (pathname: string) => {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return { prefix: `/${locale}`, path: pathname.slice(locale.length + 1) || "/" };
    }
  }
  return { prefix: "", path: pathname };
};

const finish = (res: NextResponse, pathname: string) => {
  res.headers.set("x-pathname", pathname);
  setSecurityHeaders(res);
  return res;
};

const redirectToLogin = (req: NextAuthRequest, prefix: string, callbackPath: string) => {
  const signInUrl = new URL(`${prefix}/login`, req.url);
  signInUrl.searchParams.set("callbackUrl", callbackPath);
  return NextResponse.redirect(signInUrl);
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Admin: English only, outside the storefront's locale routing.
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return finish(redirectToLogin(req, "", pathname), pathname);
    }
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    if (!isAdmin) {
      return finish(NextResponse.redirect(new URL("/", req.url)), pathname);
    }
    // Shared components (order badges, summaries…) read their language from next-intl: English here.
    const headers = new Headers(req.headers);
    headers.set("X-NEXT-INTL-LOCALE", "en");
    return finish(NextResponse.next({ request: { headers } }), pathname);
  }

  // Storefront: account pages need a signed-in user; then let next-intl resolve the locale.
  const { prefix, path } = splitLocalePrefix(pathname);
  if (!user && (path.startsWith("/account") || path.startsWith("/orders"))) {
    return finish(redirectToLogin(req, prefix, pathname), pathname);
  }

  return finish(intlMiddleware(req), pathname);
});

export const config = {
  // Everything except API routes, Next internals and files with an extension (images, robots.txt…).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
