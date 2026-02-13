import { OrderStatusBadge } from "@/components/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OrderStatus } from "@ecommerce/database/schema";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";

type RecentOrder = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  createdAt: Date;
  guestEmail: string | null;
  items: { id: string }[];
  user: { id: string; name: string | null; email: string | null } | null;
};

type Props = {
  orders: RecentOrder[];
};

const DashboardRecentOrders: React.FC<Props> = ({ orders }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders across the store</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/orders">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="border-border rounded-lg border border-dashed py-8 text-center">
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ORDER</TableHead>
                <TableHead>CUSTOMER</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>ITEMS</TableHead>
                <TableHead>TOTAL</TableHead>
                <TableHead>DATE</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <span className="font-mono text-sm font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
                  </TableCell>
                  <TableCell>
                    {order.user ? (
                      <span className="text-sm">{order.user.name ?? order.user.email ?? "—"}</span>
                    ) : order.guestEmail ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Guest
                        </Badge>
                        <span className="text-muted-foreground text-sm">{order.guestEmail}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
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
                    <span className="text-sm font-medium">{formatCurrency(order.totalAmount, order.currency)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">{formatDate(order.createdAt)}</span>
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
      </CardContent>
    </Card>
  );
};

export { DashboardRecentOrders };
