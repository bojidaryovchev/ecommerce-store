// Support email
export const CONTACT_EMAIL = "support@example.com";

// Site metadata
export const SITE_TITLE = "Ecommerce Store";
export const SITE_DESCRIPTION = "A modern ecommerce store built with Next.js";

// Toaster config
export const TOASTER_DURATION_MS = 6000;

// Security headers
export const SECURITY_HEADERS = {
  CSP: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self';",
  HSTS: "max-age=31536000; includeSubDomains",
  X_FRAME_OPTIONS: "DENY",
  X_CONTENT_TYPE_OPTIONS: "nosniff",
  REFERRER_POLICY: "strict-origin-when-cross-origin",
  PERMISSIONS_POLICY: "camera=(), microphone=(), geolocation=()",
};
