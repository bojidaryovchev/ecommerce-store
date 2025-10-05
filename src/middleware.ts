import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    // Allow access to unauthorized page
    if (pathname === "/admin/unauthorized") {
      return NextResponse.next();
    }

    // Check if user is authenticated
    if (!session?.user) {
      const signInUrl = new URL("/api/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check if user has admin role
    const userRoles = session.user.roles as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN) || userRoles.includes(UserRole.SUPER_ADMIN);

    if (!isAdmin) {
      return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
