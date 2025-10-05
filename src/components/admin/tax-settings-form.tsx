"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_TAX_CONFIG } from "@/lib/tax-config";
import { useState } from "react";

export function TaxSettingsForm() {
  const { toast } = useToast();
  const [config, setConfig] = useState(DEFAULT_TAX_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement save to database
      // await updateTaxConfiguration(config);
      toast({
        title: "Settings saved",
        description: "Tax settings have been updated successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save tax settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Configuration</CardTitle>
        <CardDescription>Configure how tax is calculated and displayed throughout the store</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Tax Calculation */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-1">
            <Label htmlFor="tax-enabled">Enable Tax Calculation</Label>
            <p className="text-muted-foreground text-sm">When enabled, tax will be calculated and added to orders</p>
          </div>
          <Switch
            id="tax-enabled"
            checked={config.enabled}
            onCheckedChange={(checked: boolean) => setConfig({ ...config, enabled: checked })}
          />
        </div>

        {/* Display Mode */}
        <div className="space-y-2">
          <Label htmlFor="display-mode">Price Display Mode</Label>
          <Select
            value={config.displayMode}
            onValueChange={(value: "INCLUSIVE" | "EXCLUSIVE") => setConfig({ ...config, displayMode: value })}
          >
            <SelectTrigger id="display-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXCLUSIVE">Prices shown without tax (US standard)</SelectItem>
              <SelectItem value="INCLUSIVE">Prices include tax (EU standard)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-sm">
            {config.displayMode === "EXCLUSIVE"
              ? "Tax will be added at checkout"
              : "Tax is already included in displayed prices"}
          </p>
        </div>

        {/* Default Tax Rate */}
        <div className="space-y-2">
          <Label htmlFor="default-rate">Default Tax Rate (%)</Label>
          <Input
            id="default-rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={(config.defaultRate * 100).toFixed(2)}
            onChange={(e) =>
              setConfig({
                ...config,
                defaultRate: parseFloat(e.target.value) / 100,
              })
            }
          />
          <p className="text-muted-foreground text-sm">Used when no specific tax rate is found for a location</p>
        </div>

        {/* Rounding Mode */}
        <div className="space-y-2">
          <Label htmlFor="rounding-mode">Tax Rounding</Label>
          <Select
            value={config.roundingMode}
            onValueChange={(value: "UP" | "DOWN" | "NEAREST") => setConfig({ ...config, roundingMode: value })}
          >
            <SelectTrigger id="rounding-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEAREST">Round to Nearest</SelectItem>
              <SelectItem value="UP">Always Round Up</SelectItem>
              <SelectItem value="DOWN">Always Round Down</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-sm">How to round tax amounts (typically to 2 decimal places)</p>
        </div>

        {/* Show Tax Breakdown */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-1">
            <Label htmlFor="show-breakdown">Show Tax Breakdown</Label>
            <p className="text-muted-foreground text-sm">Display detailed tax breakdown in cart and checkout</p>
          </div>
          <Switch
            id="show-breakdown"
            checked={config.showTaxBreakdown}
            onCheckedChange={(checked: boolean) => setConfig({ ...config, showTaxBreakdown: checked })}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
