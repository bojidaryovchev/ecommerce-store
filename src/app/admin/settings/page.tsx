import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage store settings",
};

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure your store settings</p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Settings className="text-muted-foreground mb-4 h-16 w-16" />
          <h3 className="mb-2 text-xl font-semibold">Store Settings</h3>
          <p className="text-muted-foreground text-center">
            This section is coming soon. You&apos;ll be able to configure all store settings here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
