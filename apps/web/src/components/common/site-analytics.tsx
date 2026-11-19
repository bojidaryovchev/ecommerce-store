"use client";

import { analyticsUrl } from "@/lib/analytics-url";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import React from "react";

/**
 * Page views for Vercel Web Analytics: no cookies and nothing kept on the visitor's device, so no consent is
 * asked for it (the privacy and cookie policies say what is counted). Only the storefront mounts it, so the
 * admin is never counted; what of each URL is kept is lib/analytics-url.ts.
 */
function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = analyticsUrl(event.url);
  return url ? { ...event, url } : null;
}

const SiteAnalytics: React.FC = () => <Analytics beforeSend={beforeSend} />;

export { SiteAnalytics };
