import { OrdersListSkeleton } from "@/components/common/skeletons/orders-list-skeleton";
import { OrderList } from "@/components/orders";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getOrdersByUserId } from "@/queries/orders";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React, { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.orders.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

const OrdersContent: React.FC<{ userId: string }> = async ({ userId }) => {
  const orders = await getOrdersByUserId(userId);

  return <OrderList orders={orders} />;
};

const OrdersPage: React.FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user?.id) {
    return redirect({ href: "/login", locale });
  }

  const t = await getTranslations("account.orders");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
      <Suspense fallback={<OrdersListSkeleton />}>
        <OrdersContent userId={session.user.id} />
      </Suspense>
    </div>
  );
};

export default OrdersPage;
