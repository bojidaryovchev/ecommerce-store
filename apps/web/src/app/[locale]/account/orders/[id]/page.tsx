import { OrderDetailSkeleton } from "@/components/common";
import { OrderDetail } from "@/components/orders";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getOrderById } from "@/queries/orders";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "account.orderDetail.metadata" });

  return {
    title: t("title", { number: id.slice(0, 8).toUpperCase() }),
    description: t("description"),
  };
}

const OrderContent: React.FC<{ orderId: string; userId: string }> = async ({ orderId, userId }) => {
  const order = await getOrderById(orderId);

  if (!order || order.userId !== userId) {
    notFound();
  }

  return <OrderDetail order={order} />;
};

const OrderDetailPage: React.FC<Props> = async ({ params }) => {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user?.id) {
    return redirect({ href: "/login", locale });
  }

  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderContent orderId={id} userId={session.user.id} />
    </Suspense>
  );
};

export default OrderDetailPage;
