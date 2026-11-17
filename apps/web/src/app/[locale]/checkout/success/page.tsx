import { ClearCartOnSuccess } from "@/components/checkout";
import { AddressDisplay } from "@/components/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { priceFormat } from "@/i18n/format";
import { Link, redirect } from "@/i18n/navigation";
import { getOrderByCheckoutSessionId } from "@/queries/orders";
import { CheckCircle2, Package } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import React from "react";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout.success.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

const CheckoutSuccessPage: React.FC<Props> = async ({ params, searchParams }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const { session_id } = await searchParams;

  if (!session_id) {
    return redirect({ href: "/", locale });
  }

  const t = await getTranslations("checkout.success");
  const format = await getFormatter();
  const formatPrice = (cents: number, currency: string) => format.number(cents / 100, priceFormat(currency));

  const order = await getOrderByCheckoutSessionId(session_id);

  if (!order) {
    // Order might not be created yet (webhook processing)
    return (
      <main className="max-w-container py-16">
        <ClearCartOnSuccess />
        <div className="mx-auto max-w-lg text-center">
          <CheckCircle2 className="text-primary mx-auto h-16 w-16" />
          <h1 className="mt-6 text-3xl font-bold">{t("pendingTitle")}</h1>
          <p className="text-muted-foreground mt-2">{t("pendingDescription")}</p>
          <div className="mt-8">
            <Button asChild>
              <Link href="/products">{t("continueShopping")}</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-container py-16">
      <ClearCartOnSuccess />
      <div className="mx-auto max-w-2xl">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <CheckCircle2 className="text-primary mx-auto h-16 w-16" />
          <h1 className="mt-6 text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("description")}</p>
        </div>

        {/* Order Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("orderDetails")}
            </CardTitle>
            <CardDescription>
              {t("orderMeta", {
                number: order.id.slice(0, 8).toUpperCase(),
                date: format.dateTime(new Date(order.createdAt), { dateStyle: "long" }),
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Items */}
            <div className="space-y-4">
              <h3 className="font-semibold">{t("items")}</h3>
              <div className="divide-border divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-3">
                    <div>
                      <p className="font-medium">{item.productSnapshot.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {t("quantity", {
                          quantity: item.quantity,
                          price: formatPrice(item.priceSnapshot.unitAmount, item.priceSnapshot.currency),
                        })}
                      </p>
                    </div>
                    <p className="font-medium">{formatPrice(item.totalAmount, item.priceSnapshot.currency)}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span>{formatPrice(order.subtotalAmount, order.currency)}</span>
              </div>
              {order.shippingAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("shipping")}</span>
                  <span>{formatPrice(order.shippingAmount, order.currency)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("tax")}</span>
                  <span>{formatPrice(order.taxAmount, order.currency)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("discount")}</span>
                  <span className="text-green-600">-{formatPrice(order.discountAmount, order.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>{t("total")}</span>
                <span>{formatPrice(order.totalAmount, order.currency)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">{t("shippingAddress")}</h3>
                  <AddressDisplay address={order.shippingAddress} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/products">{t("continueShopping")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/account/orders">{t("viewOrders")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default CheckoutSuccessPage;
