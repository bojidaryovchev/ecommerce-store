import { TaxRatesTable } from "@/components/admin/tax-rates-table";
import { TaxSettingsForm } from "@/components/admin/tax-settings-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tax Settings",
  description: "Configure tax rates and settings",
};

export default function TaxSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tax Settings</h1>
        <p className="text-muted-foreground mt-2">Configure tax rates and calculation settings</p>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">General Settings</TabsTrigger>
          <TabsTrigger value="rates">Tax Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <TaxSettingsForm />
        </TabsContent>

        <TabsContent value="rates">
          <TaxRatesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
