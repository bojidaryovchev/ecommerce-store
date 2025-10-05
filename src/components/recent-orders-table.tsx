"use client";

import type { RecentOrder } from "@/actions/get-order-analytics.action";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatOrderTotal, getOrderStatusInfo, getPaymentStatusInfo } from "@/lib/order-utils";
import type React from "react";

interface RecentOrdersTableProps {
  orders: RecentOrder[];
  onOrderClick?: (orderId: string) => void;
}

const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({ orders, onOrderClick }) => {
  if (orders.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-8 text-center">
        No recent orders found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order Number</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const orderStatusInfo = getOrderStatusInfo(order.status);
          const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus);

          return (
            <TableRow
              key={order.id}
              className={onOrderClick ? "hover:bg-muted/50 cursor-pointer" : undefined}
              onClick={() => onOrderClick?.(order.id)}
            >
              <TableCell className="font-medium">{order.orderNumber}</TableCell>
              <TableCell>{order.customerName || "Guest"}</TableCell>
              <TableCell>{formatOrderTotal(order.total)}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: `${orderStatusInfo.color}20`,
                    borderColor: orderStatusInfo.color,
                    color: orderStatusInfo.color,
                  }}
                >
                  {orderStatusInfo.label}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: `${paymentStatusInfo.color}20`,
                    borderColor: paymentStatusInfo.color,
                    color: paymentStatusInfo.color,
                  }}
                >
                  {paymentStatusInfo.label}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(order.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default RecentOrdersTable;
