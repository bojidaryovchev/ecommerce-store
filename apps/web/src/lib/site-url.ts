/**
 * The public origin of the site, without a trailing slash: used for sitemap, robots and absolute
 * metadata URLs. Set NEXT_PUBLIC_SITE_URL in production; Vercel's production URL is the fallback.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ??
  process.env.AUTH_URL ??
  "http://localhost:3000"
).replace(/\/+$/, "");
