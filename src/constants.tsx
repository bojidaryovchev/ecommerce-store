// Support email
export const CONTACT_EMAIL = "support@pinref.com";

// Site metadata
export const SITE_TITLE = "Next.js SST Starter";
export const SITE_DESCRIPTION = "A modern Next.js starter with SST, AWS SES, and TypeScript";

// Toaster config
export const TOASTER_DURATION_MS = 6000;

// Product defaults
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;
export const DEFAULT_PRODUCT_SKU_PREFIX = "PRD";
export const DEFAULT_CURRENCY = "USD";

// Security headers
export const SECURITY_HEADERS = {
  CSP: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self';",
  HSTS: "max-age=31536000; includeSubDomains",
  X_FRAME_OPTIONS: "DENY",
  X_CONTENT_TYPE_OPTIONS: "nosniff",
  REFERRER_POLICY: "strict-origin-when-cross-origin",
  PERMISSIONS_POLICY: "camera=(), microphone=(), geolocation=()",
};
