import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { priceFormat } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import type { OrderWithItems } from "@/queries/orders";
import { Package } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import React from "react";

type Props = {
  orders: OrderWithItems[];
};

const OrderList: React.FC<Props> = ({ orders }) => {
  const t = useTranslations("orders.list");
  const format = useFormatter();

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <Package className="text-muted-foreground mx-auto h-12 w-12" />
        <h2 className="mt-4 text-xl font-semibold">{t("emptyTitle")}</h2>
        <p className="text-muted-foreground mt-2">{t("emptyDescription")}</p>
        <Button asChild className="mt-6">
          <Link href="/products">{t("startShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.order")}</TableHead>
          <TableHead>{t("columns.date")}</TableHead>
          <TableHead>{t("columns.status")}</TableHead>
          <TableHead>{t("columns.items")}</TableHead>
          <TableHead className="text-right">{t("columns.total")}</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{t("number", { number: order.id.slice(0, 8).toUpperCase() })}</TableCell>
            <TableCell>{format.dateTime(new Date(order.createdAt), { dateStyle: "long" })}</TableCell>
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
            <TableCell>{t("itemCount", { count: order.items.length })}</TableCell>
            <TableCell className="text-right font-medium">
              {format.number(order.totalAmount / 100, priceFormat(order.currency))}
            </TableCell>
            <TableCell>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/account/orders/${order.id}`}>{t("view")}</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export { OrderList };
