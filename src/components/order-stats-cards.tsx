"use client";

import type { OrderStats } from "@/actions/get-order-analytics.action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatOrderTotal } from "@/lib/order-utils";
import { CheckCircle, DollarSign, Package, ShoppingCart, TrendingUp, XCircle } from "lucide-react";
import type React from "react";

interface OrderStatsCardsProps {
  stats: OrderStats;
}

const OrderStatsCards: React.FC<OrderStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingCart className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <p className="text-muted-foreground text-xs">Last 30 days</p>
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatOrderTotal(stats.totalRevenue)}</div>
          <p className="text-muted-foreground text-xs">From paid orders</p>
        </CardContent>
      </Card>

      {/* Average Order Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          <TrendingUp className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatOrderTotal(stats.averageOrderValue)}</div>
          <p className="text-muted-foreground text-xs">Per order</p>
        </CardContent>
      </Card>

      {/* Pending Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          <Package className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingOrders}</div>
          <p className="text-muted-foreground text-xs">Awaiting processing</p>
        </CardContent>
      </Card>

      {/* Completed Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
          <CheckCircle className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedOrders}</div>
          <p className="text-muted-foreground text-xs">Successfully delivered</p>
        </CardContent>
      </Card>

      {/* Cancelled Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cancelled Orders</CardTitle>
          <XCircle className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.cancelledOrders}</div>
          <p className="text-muted-foreground text-xs">Cancelled/refunded</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderStatsCards;
