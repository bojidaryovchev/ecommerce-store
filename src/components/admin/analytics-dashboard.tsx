"use client";

import { getAbandonedCartStats } from "@/actions/abandoned-cart.action";
import { getCustomerAnalytics } from "@/actions/get-customer-analytics.action";
import { getProductAnalytics } from "@/actions/get-product-analytics.action";
import { getRevenueAnalytics, getRevenueSummary } from "@/actions/get-revenue-analytics.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DateRange } from "@/lib/analytics-utils";
import {
  formatCurrency,
  formatNumber,
  getDateRangePreset,
  getOrderMetrics,
  getOrderStatusDistribution,
} from "@/lib/analytics-utils";
import { DollarSign, Package, RefreshCw, ShoppingCart, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { AnalyticsAbandonedCartInsights } from "./analytics-abandoned-cart-insights";
import { AnalyticsCustomerInsights } from "./analytics-customer-insights";
import { AnalyticsDateRangeSelector } from "./analytics-date-range-selector";
import { AnalyticsKpiCard } from "./analytics-kpi-card";
import { AnalyticsOrderStatusChart } from "./analytics-order-status-chart";
import { AnalyticsRevenueChart } from "./analytics-revenue-chart";
import { AnalyticsTopProductsTable } from "./analytics-top-products-table";

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangePreset("last30days"));
  const [preset, setPreset] = useState("last30days");
  const [timeGrouping, setTimeGrouping] = useState<"day" | "week" | "month">("day");
  const [isLoading, setIsLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(true);

  // State for analytics data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [revenueSummary, setRevenueSummary] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [revenueData, setRevenueData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orderMetrics, setOrderMetrics] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orderStatus, setOrderStatus] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [topProducts, setTopProducts] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customerData, setCustomerData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [abandonedCartData, setAbandonedCartData] = useState<any>(null);

  // Fetch all analytics data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch revenue summary
      const summaryResult = await getRevenueSummary({
        preset: preset !== "custom" ? preset : undefined,
        from: preset === "custom" ? dateRange.from : undefined,
        to: preset === "custom" ? dateRange.to : undefined,
      });

      if (summaryResult.success) {
        setRevenueSummary(summaryResult.data);
      }

      // Fetch revenue over time
      const revenueResult = await getRevenueAnalytics({
        preset: preset !== "custom" ? preset : undefined,
        from: preset === "custom" ? dateRange.from : undefined,
        to: preset === "custom" ? dateRange.to : undefined,
        grouping: timeGrouping,
        compare: showComparison,
      });

      if (revenueResult.success) {
        setRevenueData(revenueResult.data);
      }

      // Fetch order metrics
      const metrics = await getOrderMetrics(dateRange);
      setOrderMetrics(metrics);

      // Fetch order status distribution
      const status = await getOrderStatusDistribution(dateRange);
      setOrderStatus(status);

      // Fetch top products
      const productsResult = await getProductAnalytics({
        preset: preset !== "custom" ? preset : undefined,
        from: preset === "custom" ? dateRange.from : undefined,
        to: preset === "custom" ? dateRange.to : undefined,
        limit: 10,
      });

      if (productsResult.success) {
        setTopProducts(productsResult.data);
      }

      // Fetch customer data
      const customersResult = await getCustomerAnalytics({
        preset: preset !== "custom" ? preset : undefined,
        from: preset === "custom" ? dateRange.from : undefined,
        to: preset === "custom" ? dateRange.to : undefined,
        compare: showComparison,
      });

      if (customersResult.success) {
        setCustomerData(customersResult.data);
      }

      // Fetch abandoned cart stats
      const abandonedCartResult = await getAbandonedCartStats(dateRange.from, dateRange.to);
      if (abandonedCartResult.success) {
        setAbandonedCartData(abandonedCartResult.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update date range when preset changes
  useEffect(() => {
    if (preset !== "custom") {
      setDateRange(getDateRangePreset(preset));
    }
  }, [preset]);

  // Fetch analytics on mount and when dependencies change
  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, timeGrouping, showComparison]);

  const handlePresetChange = (newPreset: string) => {
    setPreset(newPreset);
  };

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">View detailed insights and reports</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <RefreshCw className="text-muted-foreground h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">View detailed insights and reports</p>
        </div>
        <div className="flex items-center gap-2">
          <AnalyticsDateRangeSelector
            value={dateRange}
            onChange={handleDateRangeChange}
            preset={preset}
            onPresetChange={handlePresetChange}
          />
          <Button onClick={fetchAnalytics} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {revenueSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AnalyticsKpiCard
            title="Total Revenue"
            value={formatCurrency(revenueSummary.current.revenue)}
            trend={revenueSummary.changes.revenue > 0 ? "up" : revenueSummary.changes.revenue < 0 ? "down" : "neutral"}
            trendValue={`${revenueSummary.changes.revenue.toFixed(1)}%`}
            trendLabel="from previous period"
            icon={<DollarSign className="h-4 w-4" />}
          />
          <AnalyticsKpiCard
            title="Total Orders"
            value={formatNumber(revenueSummary.current.orders)}
            trend={revenueSummary.changes.orders > 0 ? "up" : revenueSummary.changes.orders < 0 ? "down" : "neutral"}
            trendValue={`${revenueSummary.changes.orders.toFixed(1)}%`}
            trendLabel="from previous period"
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <AnalyticsKpiCard
            title="Average Order Value"
            value={formatCurrency(revenueSummary.current.averageOrderValue)}
            trend={
              revenueSummary.changes.averageOrderValue > 0
                ? "up"
                : revenueSummary.changes.averageOrderValue < 0
                  ? "down"
                  : "neutral"
            }
            trendValue={`${revenueSummary.changes.averageOrderValue.toFixed(1)}%`}
            trendLabel="from previous period"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <AnalyticsKpiCard
            title="Products Sold"
            value={formatNumber(orderMetrics?.totalItems || 0)}
            subtitle="Total units across all orders"
            icon={<Package className="h-4 w-4" />}
          />
        </div>
      )}

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="abandoned-carts">Abandoned Carts</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="mb-4 flex items-center gap-2">
            <Button
              variant={timeGrouping === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeGrouping("day")}
            >
              Daily
            </Button>
            <Button
              variant={timeGrouping === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeGrouping("week")}
            >
              Weekly
            </Button>
            <Button
              variant={timeGrouping === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeGrouping("month")}
            >
              Monthly
            </Button>
            <Button
              variant={showComparison ? "default" : "outline"}
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
            >
              Compare Periods
            </Button>
          </div>
          {revenueData && (
            <AnalyticsRevenueChart
              data={revenueData.current}
              comparisonData={revenueData.previous}
              timeGrouping={timeGrouping}
              showComparison={showComparison}
            />
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {orderStatus && (
            <AnalyticsOrderStatusChart data={orderStatus} description="Distribution of orders by status" />
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {topProducts && (
            <AnalyticsTopProductsTable
              data={topProducts.topProducts}
              description="Best performing products by revenue and units sold"
            />
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          {customerData && (
            <AnalyticsCustomerInsights
              current={customerData.current}
              previous={customerData.previous}
              description="Customer acquisition and retention metrics"
            />
          )}
        </TabsContent>

        <TabsContent value="abandoned-carts" className="space-y-4">
          {abandonedCartData && (
            <AnalyticsAbandonedCartInsights
              stats={abandonedCartData}
              description="Track abandoned cart recovery performance and conversion rates"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
