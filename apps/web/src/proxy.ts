import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { isAdminNow } from "@/lib/auth-guard";
import { NextAuthRequest } from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { setSecurityHeaders } from "./lib/headers";
import { catalogVerdict } from "./lib/route-index";

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

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Admin: English only, outside the storefront's locale routing.
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return finish(redirectToLogin(req, "", pathname), pathname);
    }
    // The database's role, not the cookie's: see lib/auth-guard.ts. Only admins come here, so the lookup is cheap.
    if (!(await isAdminNow(user.id))) {
      return finish(NextResponse.redirect(new URL("/", req.url)), pathname);
    }
    // Shared components (order badges, summaries…) read their language from next-intl: English here.
    const headers = new Headers(req.headers);
    headers.set("X-NEXT-INTL-LOCALE", "en");
    return finish(NextResponse.next({ request: { headers } }), pathname);
  }

  // Bulgarian has no prefix: /bg/... is the same page without it, for good (next-intl's own redirect is a 307).
  const defaultPrefix = `/${routing.defaultLocale}`;
  if (pathname === defaultPrefix || pathname.startsWith(`${defaultPrefix}/`)) {
    const to = pathname.slice(defaultPrefix.length) || "/";
    return finish(NextResponse.redirect(new URL(`${to}${req.nextUrl.search}`, req.url), 308), pathname);
  }

  // Storefront: account pages need a signed-in user; then let next-intl resolve the locale.
  const { prefix, path } = splitLocalePrefix(pathname);
  if (!user && (path.startsWith("/account") || path.startsWith("/orders"))) {
    return finish(redirectToLogin(req, prefix, pathname), pathname);
  }

  // A page that doesn't exist is a 404 and a category under an outdated path a 308, decided here: with
  // Cache Components the page itself commits to 200 once its shell streams (lib/route-index.ts; the
  // storefront's own pages are listed in lib/storefront-routes.ts, so a new route must be added there).
  const verdict = await catalogVerdict(path, req.nextUrl.searchParams);
  if (verdict.kind === "moved") {
    return finish(
      NextResponse.redirect(new URL(`${prefix}${verdict.to}${req.nextUrl.search}`, req.url), 308),
      pathname,
    );
  }
  if (verdict.kind === "missing") {
    // The page renders its own not-found view; the rewrite carries the status.
    const locale = prefix ? prefix.slice(1) : routing.defaultLocale;
    const headers = new Headers(req.headers);
    headers.set("X-NEXT-INTL-LOCALE", locale);
    return finish(
      NextResponse.rewrite(new URL(`/${locale}${path}`, req.url), { status: 404, request: { headers } }),
      pathname,
    );
  }

  return finish(intlMiddleware(req), pathname);
});

export const config = {
  // Everything except API routes, Next internals and files with an extension (images, robots.txt…).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
