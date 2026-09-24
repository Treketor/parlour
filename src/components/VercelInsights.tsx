"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { redactUrl } from "@/lib/analytics-url";

/**
 * Vercel's page views and Core Web Vitals. Both are cookieless and report
 * nothing in development. URLs are stripped of anything personal first.
 */
export function VercelInsights() {
  return (
    <>
      <Analytics beforeSend={(event) => ({ ...event, url: redactUrl(event.url) })} />
      <SpeedInsights beforeSend={(event) => ({ ...event, url: redactUrl(event.url) })} />
    </>
  );
}
