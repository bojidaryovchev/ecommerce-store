"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/analytics-utils";
import { format } from "date-fns";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface RevenueChartData {
  date: Date;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

interface AnalyticsRevenueChartProps {
  data: RevenueChartData[];
  comparisonData?: RevenueChartData[];
  title?: string;
  description?: string;
  showComparison?: boolean;
  timeGrouping?: "hour" | "day" | "week" | "month";
}

// Custom tooltip component - moved outside render

const CustomTooltip = ({
  active,
  payload,
  showComparison,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  showComparison?: boolean;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background rounded-lg border p-3 shadow-lg">
        <p className="mb-2 font-medium">{payload[0].payload.date}</p>
        <div className="space-y-1 text-sm">
          <p className="text-blue-600 dark:text-blue-400">Revenue: {formatCurrency(payload[0].value)}</p>
          {showComparison && payload.length > 1 && (
            <p className="text-gray-500 dark:text-gray-400">Previous: {formatCurrency(payload[1].value)}</p>
          )}
          <p className="text-muted-foreground">Orders: {payload[0].payload.orders}</p>
          <p className="text-muted-foreground">AOV: {formatCurrency(payload[0].payload.aov)}</p>
        </div>
      </div>
    );
  }
  return null;
};

export function AnalyticsRevenueChart({
  data,
  comparisonData,
  title = "Revenue Over Time",
  description,
  showComparison = false,
  timeGrouping = "day",
}: AnalyticsRevenueChartProps) {
  // Format the data for recharts
  const formatDate = (date: Date) => {
    switch (timeGrouping) {
      case "hour":
        return format(date, "MMM d, ha");
      case "day":
        return format(date, "MMM d");
      case "week":
        return format(date, "MMM d");
      case "month":
        return format(date, "MMM yyyy");
      default:
        return format(date, "MMM d");
    }
  };

  const chartData = data.map((item) => ({
    date: formatDate(item.date),
    revenue: Number(item.revenue),
    orders: item.orders,
    aov: Number(item.averageOrderValue),
  }));

  // If comparison data exists, merge it
  let comparisonChartData: typeof chartData | undefined;
  if (showComparison && comparisonData) {
    comparisonChartData = comparisonData.map((item) => ({
      date: formatDate(item.date),
      revenue: Number(item.revenue),
      orders: item.orders,
      aov: Number(item.averageOrderValue),
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" tick={{ fill: "currentColor" }} />
            <YAxis
              className="text-xs"
              tick={{ fill: "currentColor" }}
              tickFormatter={(value: number) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip showComparison={showComparison} />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Current Period"
            />
            {showComparison && comparisonChartData && (
              <Line
                type="monotone"
                data={comparisonChartData}
                dataKey="revenue"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                name="Previous Period"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
