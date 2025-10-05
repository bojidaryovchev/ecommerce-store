"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculatePercentageChange, formatCurrency, formatNumber } from "@/lib/analytics-utils";
import { DollarSign, UserCheck, UserPlus, Users } from "lucide-react";

interface CustomerMetrics {
  total: number;
  new: number;
  returning: number;
  averageLifetimeValue: number;
}

interface AnalyticsCustomerInsightsProps {
  current: CustomerMetrics;
  previous?: CustomerMetrics;
  title?: string;
  description?: string;
}

export function AnalyticsCustomerInsights({
  current,
  previous,
  title = "Customer Insights",
  description,
}: AnalyticsCustomerInsightsProps) {
  const totalChange = previous ? calculatePercentageChange(current.total, previous.total) : null;
  const newChange = previous ? calculatePercentageChange(current.new, previous.new) : null;
  const returningChange = previous ? calculatePercentageChange(current.returning, previous.returning) : null;
  const ltvChange = previous
    ? calculatePercentageChange(current.averageLifetimeValue, previous.averageLifetimeValue)
    : null;

  const metrics = [
    {
      label: "Total Customers",
      value: formatNumber(current.total),
      change: totalChange,
      icon: Users,
      color: "text-blue-600 dark:text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      label: "New Customers",
      value: formatNumber(current.new),
      change: newChange,
      icon: UserPlus,
      color: "text-green-600 dark:text-green-500",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      label: "Returning Customers",
      value: formatNumber(current.returning),
      change: returningChange,
      icon: UserCheck,
      color: "text-purple-600 dark:text-purple-500",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      label: "Avg. Lifetime Value",
      value: formatCurrency(current.averageLifetimeValue),
      change: ltvChange,
      icon: DollarSign,
      color: "text-orange-600 dark:text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  const getChangeColor = (change: number | null) => {
    if (change === null) return "";
    if (change > 0) return "text-green-600 dark:text-green-500";
    if (change < 0) return "text-red-600 dark:text-red-500";
    return "text-gray-600 dark:text-gray-400";
  };

  const formatChange = (change: number | null) => {
    if (change === null) return null;
    const prefix = change > 0 ? "+" : "";
    return `${prefix}${change.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="flex items-start space-x-3 rounded-lg border p-4">
                <div className={`rounded-lg p-2 ${metric.bgColor}`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-muted-foreground text-sm font-medium">{metric.label}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  {metric.change !== null && (
                    <p className={`text-xs font-medium ${getChangeColor(metric.change)}`}>
                      {formatChange(metric.change)} from previous period
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional insights */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground mb-2 text-sm font-medium">Customer Retention</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold">
                {current.total > 0 ? ((current.returning / current.total) * 100).toFixed(1) : "0.0"}%
              </p>
              <p className="text-muted-foreground text-sm">
                {formatNumber(current.returning)} of {formatNumber(current.total)} customers
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground mb-2 text-sm font-medium">New Customer Rate</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold">
                {current.total > 0 ? ((current.new / current.total) * 100).toFixed(1) : "0.0"}%
              </p>
              <p className="text-muted-foreground text-sm">
                {formatNumber(current.new)} of {formatNumber(current.total)} customers
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
