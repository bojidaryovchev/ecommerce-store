import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description: "View store analytics and insights",
};

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
