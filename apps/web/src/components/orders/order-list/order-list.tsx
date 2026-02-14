import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OrderWithItems } from "@/queries/orders";
import { Package } from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {
  orders: OrderWithItems[];
};

const OrderList: React.FC<Props> = ({ orders }) => {
  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <Package className="text-muted-foreground mx-auto h-12 w-12" />
        <h2 className="mt-4 text-xl font-semibold">No orders yet</h2>
        <p className="text-muted-foreground mt-2">When you place an order, it will appear here.</p>
        <Button asChild className="mt-6">
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Items</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
            <TableCell>{formatDate(order.createdAt)}</TableCell>
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
            <TableCell>
              {order.items.length} {order.items.length === 1 ? "item" : "items"}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(order.totalAmount, order.currency)}
            </TableCell>
            <TableCell>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/account/orders/${order.id}`}>View</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export { OrderList };
