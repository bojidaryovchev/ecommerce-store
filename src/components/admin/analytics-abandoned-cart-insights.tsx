"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/analytics-utils";
import { AlertCircle, CheckCircle2, Mail, ShoppingCart, TrendingUp } from "lucide-react";

interface AbandonedCartAnalyticsProps {
  stats: {
    totalAbandoned: number;
    recovered: number;
    recoveryRate: number;
    ordersCreated: number;
    conversionRate: number;
    revenueRecovered: number;
    totalCarts: number;
    avgCartValue: number;
    recoveredValue: number;
  };
  description?: string;
}

export function AnalyticsAbandonedCartInsights({ stats, description }: AbandonedCartAnalyticsProps) {
  const recoveryChannels = [
    { name: "Email Recovery", value: stats.recovered || 0 },
    { name: "Direct Link", value: Math.max(0, (stats.ordersCreated || 0) - (stats.recovered || 0)) },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Abandoned Cart Recovery</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Abandoned */}
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <ShoppingCart className="h-4 w-4" />
                <span>Total Abandoned</span>
              </div>
              <div className="text-3xl font-bold">{stats.totalCarts}</div>
              <p className="text-muted-foreground text-xs">Avg Value: {formatCurrency(stats.avgCartValue)}</p>
            </div>

            {/* Recovery Rate */}
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>Recovery Rate</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">{stats.recoveryRate.toFixed(1)}%</div>
              <p className="text-muted-foreground text-xs">
                {stats.recovered} of {stats.totalAbandoned} recovered
              </p>
            </div>

            {/* Conversion Rate */}
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Conversion Rate</span>
              </div>
              <div className="text-3xl font-bold text-green-600">{stats.conversionRate.toFixed(1)}%</div>
              <p className="text-muted-foreground text-xs">{stats.ordersCreated} orders created</p>
            </div>

            {/* Revenue Recovered */}
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>Revenue Recovered</span>
              </div>
              <div className="text-3xl font-bold text-emerald-600">{formatCurrency(stats.recoveredValue)}</div>
              <p className="text-muted-foreground text-xs">From {stats.recovered} recovered carts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Recovery Funnel</CardTitle>
          <CardDescription>Track the journey from abandonment to purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Abandoned Carts */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Carts Abandoned</p>
                    <p className="text-muted-foreground text-sm">Initial cart abandonment</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.totalAbandoned}</p>
                  <p className="text-muted-foreground text-sm">100%</p>
                </div>
              </div>
              <div className="mt-2 ml-5 h-8 w-0.5 bg-gray-200" />
            </div>

            {/* Recovery Attempts */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Carts Recovered</p>
                    <p className="text-muted-foreground text-sm">Customer returned to cart</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.recovered}</p>
                  <p className="text-muted-foreground text-sm">
                    {stats.totalAbandoned > 0 ? ((stats.recovered / stats.totalAbandoned) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
              <div className="mt-2 ml-5 h-8 w-0.5 bg-gray-200" />
            </div>

            {/* Conversions */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Orders Created</p>
                    <p className="text-muted-foreground text-sm">Successfully converted to purchase</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.ordersCreated}</p>
                  <p className="text-muted-foreground text-sm">
                    {stats.totalAbandoned > 0 ? ((stats.ordersCreated / stats.totalAbandoned) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Channel Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Recovery Channels</CardTitle>
          <CardDescription>How customers returned to their carts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recoveryChannels.map((channel, index) => {
              const percentage = stats.recovered > 0 ? (channel.value / stats.recovered) * 100 : 0;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{channel.name}</span>
                    <span className="text-muted-foreground">
                      {channel.value} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full transition-all ${index === 0 ? "bg-blue-600" : "bg-green-600"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
              <p>
                <span className="font-medium">{stats.recoveryRate.toFixed(0)}% recovery rate</span> - {stats.recovered}{" "}
                out of {stats.totalAbandoned} abandoned carts were recovered
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green-600" />
              <p>
                <span className="font-medium">{stats.conversionRate.toFixed(0)}% conversion rate</span> -{" "}
                {stats.ordersCreated} recovered carts resulted in completed orders
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <p>
                <span className="font-medium">{formatCurrency(stats.recoveredValue)} revenue recovered</span> - Average
                value of {formatCurrency(stats.avgCartValue)} per abandoned cart
              </p>
            </div>
            {stats.recoveryRate > 0 && stats.recoveryRate < 30 && (
              <div className="mt-4 rounded-lg bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">
                  💡 <span className="font-medium">Tip:</span> Your recovery rate is below 30%. Consider adjusting email
                  timing, adding incentives, or improving email content to boost recovery.
                </p>
              </div>
            )}
            {stats.conversionRate > 0 && stats.conversionRate < 50 && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  💡 <span className="font-medium">Tip:</span>{" "}
                  {(((stats.recovered - stats.ordersCreated) / stats.recovered) * 100).toFixed(0)}% of recovered carts
                  didn&apos;t convert. Consider simplifying checkout or adding urgency elements.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
