import { getStorefrontPromotions } from "@/queries/promotions";
import { Tag } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import React from "react";
import { CopyCode } from "./copy-code";

/**
 * The promotion codes the admin chose to advertise, as a strip under the hero; nothing when there
 * are none. The discount is taken at checkout, on Stripe's page, where the code is typed in.
 */
const PromoStrip: React.FC = async () => {
  const [promotions, t, format] = await Promise.all([
    getStorefrontPromotions(),
    getTranslations("home.promo"),
    getFormatter(),
  ]);
  if (promotions.length === 0) return null;
  const money = (cents: number, currency: string | null) =>
    format.number(cents / 100, {
      style: "currency",
      currency: (currency ?? "eur").toUpperCase(),
      maximumFractionDigits: 2,
    });

  return (
    <section aria-label={t("label")} className="max-w-container pt-6">
      <ul className="space-y-2">
        {promotions.map((promotion) => (
          <li
            key={promotion.code}
            className="bg-heat-soft flex flex-col gap-3 rounded-2xl px-5 py-4 sm:flex-row sm:items-center"
          >
            <Tag className="text-heat size-5 shrink-0" aria-hidden />
            <p className="flex-1 text-sm">
              <span className="font-semibold">
                {promotion.percentOff !== null
                  ? t("percent", { percent: promotion.percentOff })
                  : t("amount", { amount: money(promotion.amountOff ?? 0, promotion.currency) })}
              </span>{" "}
              <span className="bg-background rounded-md px-1.5 py-0.5 font-mono font-bold tracking-wider">
                {promotion.code}
              </span>
              {promotion.minimumAmount ? ` ${t("minimum", { amount: money(promotion.minimumAmount, "eur") })}` : ""}
              {promotion.expiresAt
                ? ` ${t("until", { date: format.dateTime(promotion.expiresAt, { day: "numeric", month: "long" }) })}`
                : ""}
              <span className="text-muted-foreground"> · {t("howTo")}</span>
            </p>
            <CopyCode code={promotion.code} />
          </li>
        ))}
      </ul>
    </section>
  );
};

export { PromoStrip };
