"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Info, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AbandonedCartSettings {
  abandonmentThreshold: number;
  minimumCartValue: number;
  maxReminders: number;
  reminderIntervals: number[];
  discountEnabled: boolean;
  discountCode: string;
  discountAmount: number;
  emailsEnabled: boolean;
}

// Default settings matching the detector utility
const DEFAULT_SETTINGS: AbandonedCartSettings = {
  abandonmentThreshold: 1,
  minimumCartValue: 10,
  maxReminders: 3,
  reminderIntervals: [1, 24, 72],
  discountEnabled: true,
  discountCode: "COMEBACK10",
  discountAmount: 10,
  emailsEnabled: true,
};

export default function AbandonedCartSettingsPage() {
  const [settings, setSettings] = useState<AbandonedCartSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("abandonedCartSettings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to parse saved settings:", error);
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate settings
      if (settings.abandonmentThreshold < 0.25) {
        toast.error("Abandonment threshold must be at least 15 minutes (0.25 hours)");
        return;
      }
      if (settings.minimumCartValue < 0) {
        toast.error("Minimum cart value cannot be negative");
        return;
      }
      if (settings.maxReminders < 1 || settings.maxReminders > 5) {
        toast.error("Max reminders must be between 1 and 5");
        return;
      }
      if (settings.reminderIntervals.length !== settings.maxReminders) {
        toast.error("Number of reminder intervals must match max reminders");
        return;
      }
      if (settings.discountEnabled && !settings.discountCode) {
        toast.error("Discount code is required when discount is enabled");
        return;
      }
      if (settings.discountEnabled && (settings.discountAmount < 1 || settings.discountAmount > 100)) {
        toast.error("Discount amount must be between 1% and 100%");
        return;
      }

      // Save to localStorage (in production, this would be saved to database)
      localStorage.setItem("abandonedCartSettings", JSON.stringify(settings));

      setHasChanges(false);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset all settings to defaults? This cannot be undone.")) {
      setSettings(DEFAULT_SETTINGS);
      setHasChanges(true);
      toast.success("Settings reset to defaults");
    }
  };

  const updateSetting = <K extends keyof AbandonedCartSettings>(key: K, value: AbandonedCartSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateReminderInterval = (index: number, value: number) => {
    const newIntervals = [...settings.reminderIntervals];
    newIntervals[index] = value;
    updateSetting("reminderIntervals", newIntervals);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Abandoned Cart Settings</h1>
          <p className="text-muted-foreground mt-2">Configure automated cart recovery behavior</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" disabled={isSaving}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="text-sm text-blue-900">
            <p className="mb-1 font-medium">Note about settings persistence</p>
            <p>
              Currently, settings are stored in your browser&apos;s localStorage for demonstration purposes. In
              production, these should be stored in the database and synchronized across all instances. You&apos;ll need
              to manually update the <code className="rounded bg-blue-100 px-1 py-0.5">DEFAULT_ABANDONMENT_CONFIG</code>{" "}
              in <code className="rounded bg-blue-100 px-1 py-0.5">src/lib/abandoned-cart-detector.ts</code> to apply
              changes server-side.
            </p>
          </div>
        </div>
      </div>

      {/* Detection Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Detection Settings</CardTitle>
          <CardDescription>Configure when carts are considered abandoned</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="abandonmentThreshold">Abandonment Threshold (hours)</Label>
              <Input
                id="abandonmentThreshold"
                type="number"
                min="0.25"
                step="0.25"
                value={settings.abandonmentThreshold}
                onChange={(e) => updateSetting("abandonmentThreshold", parseFloat(e.target.value))}
              />
              <p className="text-muted-foreground text-xs">
                Time before a cart is considered abandoned (minimum 15 minutes)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumCartValue">Minimum Cart Value ($)</Label>
              <Input
                id="minimumCartValue"
                type="number"
                min="0"
                step="1"
                value={settings.minimumCartValue}
                onChange={(e) => updateSetting("minimumCartValue", parseFloat(e.target.value))}
              />
              <p className="text-muted-foreground text-xs">Only track carts above this value</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Email Reminder Settings</CardTitle>
          <CardDescription>Configure automated recovery email behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailsEnabled">Enable Email Reminders</Label>
              <p className="text-muted-foreground text-sm">Send automated recovery emails to customers</p>
            </div>
            <Switch
              id="emailsEnabled"
              checked={settings.emailsEnabled}
              onCheckedChange={(checked) => updateSetting("emailsEnabled", checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="maxReminders">Maximum Reminders</Label>
            <Select
              value={settings.maxReminders.toString()}
              onValueChange={(value) => {
                const num = parseInt(value);
                updateSetting("maxReminders", num);
                // Adjust intervals array to match
                const newIntervals = [...settings.reminderIntervals];
                while (newIntervals.length < num) {
                  newIntervals.push(72);
                }
                while (newIntervals.length > num) {
                  newIntervals.pop();
                }
                updateSetting("reminderIntervals", newIntervals);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 reminder</SelectItem>
                <SelectItem value="2">2 reminders</SelectItem>
                <SelectItem value="3">3 reminders</SelectItem>
                <SelectItem value="4">4 reminders</SelectItem>
                <SelectItem value="5">5 reminders</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">Maximum number of recovery emails to send per cart</p>
          </div>

          <div className="space-y-4">
            <Label>Reminder Schedule (hours after abandonment)</Label>
            {settings.reminderIntervals.map((interval, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`interval-${index}`} className="text-sm">
                    Reminder {index + 1}
                  </Label>
                  <Input
                    id={`interval-${index}`}
                    type="number"
                    min="1"
                    step="1"
                    value={interval}
                    onChange={(e) => updateReminderInterval(index, parseInt(e.target.value))}
                  />
                </div>
                <div className="text-muted-foreground flex-1 pt-6 text-sm">
                  {interval < 24
                    ? `${interval} hour${interval !== 1 ? "s" : ""}`
                    : interval === 24
                      ? "1 day"
                      : `${(interval / 24).toFixed(1)} days`}
                </div>
              </div>
            ))}
            <p className="text-muted-foreground text-xs">Schedule when each reminder email should be sent</p>
          </div>
        </CardContent>
      </Card>

      {/* Discount Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Discount Settings</CardTitle>
          <CardDescription>Configure discount codes for final reminder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="discountEnabled">Enable Discount in Final Email</Label>
              <p className="text-muted-foreground text-sm">Include a discount code in the last reminder email</p>
            </div>
            <Switch
              id="discountEnabled"
              checked={settings.discountEnabled}
              onCheckedChange={(checked) => updateSetting("discountEnabled", checked)}
            />
          </div>

          {settings.discountEnabled && (
            <>
              <Separator />
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discountCode">Discount Code</Label>
                  <Input
                    id="discountCode"
                    type="text"
                    placeholder="COMEBACK10"
                    value={settings.discountCode}
                    onChange={(e) => updateSetting("discountCode", e.target.value.toUpperCase())}
                  />
                  <p className="text-muted-foreground text-xs">
                    Must be created in{" "}
                    <Link href="https://dashboard.stripe.com/coupons" className="underline" target="_blank">
                      Stripe Dashboard
                    </Link>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountAmount">Discount Amount (%)</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={settings.discountAmount}
                    onChange={(e) => updateSetting("discountAmount", parseInt(e.target.value))}
                  />
                  <p className="text-muted-foreground text-xs">Percentage discount (1-100%)</p>
                </div>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
                  <div className="text-sm text-orange-900">
                    <p className="mb-1 font-medium">Important</p>
                    <p>
                      You must create the discount code{" "}
                      <code className="rounded bg-orange-100 px-1 py-0.5">{settings.discountCode}</code> in your Stripe
                      Dashboard before it can be used. The discount will not work if the code doesn&apos;t exist in
                      Stripe.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Preview</CardTitle>
          <CardDescription>Summary of your abandoned cart recovery settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cart becomes abandoned after:</span>
              <span className="font-medium">
                {settings.abandonmentThreshold < 1
                  ? `${settings.abandonmentThreshold * 60} minutes`
                  : `${settings.abandonmentThreshold} hour${settings.abandonmentThreshold !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimum cart value tracked:</span>
              <span className="font-medium">${settings.minimumCartValue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email reminders:</span>
              <span className="font-medium">
                {settings.emailsEnabled ? `${settings.maxReminders} emails` : "Disabled"}
              </span>
            </div>
            {settings.emailsEnabled && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email schedule:</span>
                <span className="font-medium">
                  {settings.reminderIntervals.map((h) => `${h}h`).join(", ")} after abandonment
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Final email discount:</span>
              <span className="font-medium">
                {settings.discountEnabled ? `${settings.discountAmount}% (${settings.discountCode})` : "None"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
