"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

/** Copies a promotion code for pasting on the payment page. */
const CopyCode: React.FC<{ code: string }> = ({ code }) => {
  const t = useTranslations("home.promo");
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard
          ?.writeText(code)
          .then(() => setCopied(true))
          .catch(() => setCopied(false))
      }
      className="bg-background hover:bg-background/80 inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full px-4 text-xs font-semibold ring-1 ring-black/10 transition-colors sm:self-auto"
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
    </button>
  );
};

export { CopyCode };
