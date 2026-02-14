import { auth } from "@/lib/auth";
import { UserRole } from "@ecommerce/database/schema";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { setSecurityHeaders } from "./lib/headers";

const setPathnameHeader = (res: NextResponse, pathname: string) => {
  res.headers.set("x-pathname", pathname);
};

const protectAuthRoutes = (req: NextAuthRequest, pathname: string) => {
  if (pathname.startsWith("/orders") || pathname.startsWith("/account")) {
    const session = req.auth;

    if (!session?.user) {
      const signInUrl = new URL("/api/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }
};

const protectAdminRoutes = (req: NextAuthRequest, pathname: string) => {
  if (pathname.startsWith("/admin")) {
    // Allow access to unauthorized page
    if (pathname === "/admin/unauthorized") {
      return NextResponse.next();
    }

    const session = req.auth;

    // Check if user is authenticated
    if (!session?.user) {
      const signInUrl = new URL("/api/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check if user has admin role
    const userRole = session.user.role;
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isAdmin) {
      return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
    }
  }
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  setPathnameHeader(res, pathname);
  setSecurityHeaders(res);

  return protectAuthRoutes(req, pathname) ?? protectAdminRoutes(req, pathname) ?? res;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
