import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
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
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatCurrency(subtotalAmount, currency)}</span>
      </div>
      {shippingAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span>{formatCurrency(shippingAmount, currency)}</span>
        </div>
      )}
      {taxAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span>{formatCurrency(taxAmount, currency)}</span>
        </div>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Discount</span>
          <span className="text-green-600">-{formatCurrency(discountAmount, currency)}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>{formatCurrency(totalAmount, currency)}</span>
      </div>
    </div>
  );
};

export { OrderSummary };
