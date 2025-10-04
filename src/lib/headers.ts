import { SECURITY_HEADERS } from "@/constants";
import { NextResponse } from "next/server";

export const applySecurityHeaders = (response: NextResponse) => {
  response.headers.set("Content-Security-Policy", SECURITY_HEADERS.CSP);
  response.headers.set("Strict-Transport-Security", SECURITY_HEADERS.HSTS);
  response.headers.set("X-Frame-Options", SECURITY_HEADERS.X_FRAME_OPTIONS);
  response.headers.set("X-Content-Type-Options", SECURITY_HEADERS.X_CONTENT_TYPE_OPTIONS);
  response.headers.set("Referrer-Policy", SECURITY_HEADERS.REFERRER_POLICY);
  response.headers.set("Permissions-Policy", SECURITY_HEADERS.PERMISSIONS_POLICY);
};
