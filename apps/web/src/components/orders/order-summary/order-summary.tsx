import { Separator } from "@/components/ui/separator";
import { priceFormat } from "@/i18n/format";
import { useFormatter, useTranslations } from "next-intl";
import React from "react";

type Props = {
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
};

const OrderSummary: React.FC<Props> = ({
  subtotalAmount,
  shippingAmount,
  taxAmount,
  discountAmount,
  totalAmount,
  currency,
}) => {
  const t = useTranslations("orders.summary");
  const format = useFormatter();
  const formatPrice = (cents: number) => format.number(cents / 100, priceFormat(currency));

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t("subtotal")}</span>
        <span>{formatPrice(subtotalAmount)}</span>
      </div>
      {shippingAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("shipping")}</span>
          <span>{formatPrice(shippingAmount)}</span>
        </div>
      )}
      {taxAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("tax")}</span>
          <span>{formatPrice(taxAmount)}</span>
        </div>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("discount")}</span>
          <span className="text-green-600">-{formatPrice(discountAmount)}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between font-semibold">
        <span>{t("total")}</span>
        <span>{formatPrice(totalAmount)}</span>
      </div>
    </div>
  );
};

export { OrderSummary };
