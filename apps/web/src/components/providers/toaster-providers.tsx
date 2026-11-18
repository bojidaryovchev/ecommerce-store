import { TOASTER_DURATION_MS } from "@/constants";
import React, { PropsWithChildren } from "react";
import { Toaster } from "react-hot-toast";

/** The emerald the shop uses for "in stock" and other good news (Tailwind's emerald-500). */
const SUCCESS = "oklch(0.696 0.17 162.48)";

/**
 * Notifications, in the shop's own look: a card surface with the site's border, radius and navy type, the
 * emerald of good news and the red of errors for the icons. Inline styles, because react-hot-toast sets its
 * defaults inline; the colours are the theme's CSS variables, so a dark theme carries over.
 */
const ToasterProviders: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        gutter={10}
        containerStyle={{ top: 16, left: 16, right: 16 }}
        toastOptions={{
          duration: TOASTER_DURATION_MS,
          style: {
            background: "var(--card)",
            color: "var(--card-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "calc(var(--radius) + 4px)",
            boxShadow: "0 12px 32px -12px oklch(0.21 0.025 255 / 0.28), 0 2px 6px -2px oklch(0.21 0.025 255 / 0.08)",
            padding: "10px 14px",
            fontSize: "0.875rem",
            fontWeight: 500,
            lineHeight: 1.45,
            maxWidth: "min(28rem, calc(100vw - 2rem))",
          },
          success: { iconTheme: { primary: SUCCESS, secondary: "var(--card)" } },
          error: { iconTheme: { primary: "var(--destructive)", secondary: "var(--card)" } },
          loading: { iconTheme: { primary: "var(--primary)", secondary: "var(--border)" } },
        }}
      />
    </>
  );
};

export default ToasterProviders;
