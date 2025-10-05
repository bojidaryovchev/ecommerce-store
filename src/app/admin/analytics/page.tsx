import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Analytics",
  description: "View store analytics and insights",
};

const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">View detailed insights and reports</p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="text-muted-foreground mb-4 h-16 w-16" />
          <h3 className="mb-2 text-xl font-semibold">Analytics Dashboard</h3>
          <p className="text-muted-foreground text-center">
            This section is coming soon. You&apos;ll be able to view detailed analytics and reports here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
