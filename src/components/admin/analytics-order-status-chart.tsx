"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface OrderStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface AnalyticsOrderStatusChartProps {
  data: OrderStatusData[];
  title?: string;
  description?: string;
}

// Color mapping for order statuses
const STATUS_COLORS: Record<string, string> = {
  PENDING: "hsl(45, 93%, 47%)", // Yellow
  PROCESSING: "hsl(217, 91%, 60%)", // Blue
  SHIPPED: "hsl(262, 83%, 58%)", // Purple
  DELIVERED: "hsl(142, 71%, 45%)", // Green
  CANCELLED: "hsl(0, 72%, 51%)", // Red
  REFUNDED: "hsl(24, 95%, 53%)", // Orange
};

export function AnalyticsOrderStatusChart({
  data,
  title = "Order Status Distribution",
  description,
}: AnalyticsOrderStatusChartProps) {
  // Format data for the pie chart
  const chartData = data.map((item) => ({
    name: item.status.charAt(0) + item.status.slice(1).toLowerCase(),
    value: item.count,
    percentage: item.percentage,
  }));

  // Custom tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background rounded-lg border p-3 shadow-lg">
          <p className="mb-1 font-medium">{payload[0].name}</p>
          <p className="text-muted-foreground text-sm">Orders: {payload[0].value}</p>
          <p className="text-muted-foreground text-sm">{payload[0].payload.percentage.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  // Custom label
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is > 5%
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={120}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[data[index].status] || "hsl(var(--muted))"} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value, entry: any) => (
                <span className="text-sm">
                  {value} ({entry.payload.value})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
