"use client";

import { OrderStatusBadge } from "@/components/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OrderWithItemsAndUser } from "@/queries/orders";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

const ALL_STATUSES: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

type Props = {
  orders: OrderWithItemsAndUser[];
  currentStatus?: OrderStatus;
};

const OrdersTable: React.FC<Props> = ({ orders, currentStatus }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/admin/orders?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium">Status:</span>
          <Select value={currentStatus ?? "all"} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ALL_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-muted-foreground ml-auto text-sm">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </div>
      </div>

      {/* Table */}
      {orders.length === 0 ? (
        <div className="border-border rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ORDER</TableHead>
              <TableHead>CUSTOMER</TableHead>
              <TableHead>DATE</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>ITEMS</TableHead>
              <TableHead>TOTAL</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <span className="font-mono text-sm font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    {order.user ? (
                      <>
                        <span className="font-medium">{order.user.name ?? "—"}</span>
                        <span className="text-muted-foreground text-sm">{order.user.email}</span>
                      </>
                    ) : order.guestEmail ? (
                      <>
                        <Badge variant="outline" className="mb-1 w-fit text-xs">
                          Guest
                        </Badge>
                        <span className="text-muted-foreground text-sm">{order.guestEmail}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDate(order.createdAt)}</span>
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{formatCurrency(order.totalAmount, order.currency)}</span>
                </TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/orders/${order.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export { OrdersTable };
