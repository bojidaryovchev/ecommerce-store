"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { sendTestStockAlert } from "@/lib/email-notifications";
import { Bell, Mail, Package, Save, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface InventorySettings {
  defaultThreshold: number;
  criticalThreshold: number;
  enableAlerts: boolean;
  enableEmailAlerts: boolean;
  alertEmails: string;
  checkInterval: number;
}

const DEFAULT_SETTINGS: InventorySettings = {
  defaultThreshold: 5,
  criticalThreshold: 1,
  enableAlerts: true,
  enableEmailAlerts: false,
  alertEmails: "",
  checkInterval: 60, // minutes
};

export default function InventorySettingsPage() {
  const [settings, setSettings] = useState<InventorySettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  // Load settings from localStorage (in production, would be from database)
  useEffect(() => {
    const saved = localStorage.getItem("inventorySettings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to parse settings:", error);
      }
    }
  }, []);

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem("inventorySettings", JSON.stringify(settings));
      alert("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Test email alerts
  const handleTestEmail = async () => {
    if (!settings.alertEmails) {
      alert("Please enter at least one email address");
      return;
    }

    setTestingEmail(true);
    try {
      const emails = settings.alertEmails.split(",").map((e) => e.trim());
      const result = await sendTestStockAlert(emails[0]);

      if (result.success) {
        alert(`Test email sent to ${emails[0]}`);
      } else {
        alert(`Failed to send test email: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to send test email:", error);
      alert("Failed to send test email");
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Settings</h1>
        <p className="text-muted-foreground">Configure stock alerts, thresholds, and notification preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stock Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Thresholds
            </CardTitle>
            <CardDescription>Default threshold values for new products</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultThreshold">Default Low Stock Threshold</Label>
              <Input
                id="defaultThreshold"
                type="number"
                min="0"
                value={settings.defaultThreshold}
                onChange={(e) => setSettings({ ...settings, defaultThreshold: parseInt(e.target.value, 10) || 0 })}
              />
              <p className="text-muted-foreground text-xs">
                Products will be marked as low stock when quantity falls below this value
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="criticalThreshold">Critical Stock Threshold</Label>
              <Input
                id="criticalThreshold"
                type="number"
                min="0"
                value={settings.criticalThreshold}
                onChange={(e) => setSettings({ ...settings, criticalThreshold: parseInt(e.target.value, 10) || 0 })}
              />
              <p className="text-muted-foreground text-xs">
                Products will be marked as critical when quantity falls to this value or below
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-900">
                <strong>Note:</strong> These thresholds apply to new products. Existing products keep their individual
                threshold settings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alert Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alert Preferences
            </CardTitle>
            <CardDescription>Configure how and when you receive stock alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableAlerts">Enable Stock Alerts</Label>
                <p className="text-muted-foreground text-xs">Receive alerts when stock levels are low</p>
              </div>
              <Checkbox
                id="enableAlerts"
                checked={settings.enableAlerts}
                onCheckedChange={(checked: boolean) => setSettings({ ...settings, enableAlerts: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableEmailAlerts">Email Notifications</Label>
                <p className="text-muted-foreground text-xs">Send alerts via email (requires email service setup)</p>
              </div>
              <Checkbox
                id="enableEmailAlerts"
                checked={settings.enableEmailAlerts}
                onCheckedChange={(checked: boolean) => setSettings({ ...settings, enableEmailAlerts: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="checkInterval">Check Interval (minutes)</Label>
              <Input
                id="checkInterval"
                type="number"
                min="5"
                max="1440"
                value={settings.checkInterval}
                onChange={(e) => setSettings({ ...settings, checkInterval: parseInt(e.target.value, 10) || 60 })}
              />
              <p className="text-muted-foreground text-xs">How often to check stock levels (5-1440 minutes)</p>
            </div>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>Configure email addresses for stock alert notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alertEmails">Alert Email Addresses</Label>
              <Input
                id="alertEmails"
                type="text"
                placeholder="admin@example.com, manager@example.com"
                value={settings.alertEmails}
                onChange={(e) => setSettings({ ...settings, alertEmails: e.target.value })}
              />
              <p className="text-muted-foreground text-xs">Enter one or more email addresses separated by commas</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleTestEmail} disabled={testingEmail || !settings.alertEmails}>
                <Mail className="mr-2 h-4 w-4" />
                {testingEmail ? "Sending..." : "Send Test Email"}
              </Button>
              <p className="text-muted-foreground text-xs">Send a test alert to verify your email configuration</p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="mb-2 font-semibold text-blue-900">Email Service Configuration</h4>
              <p className="mb-2 text-sm text-blue-800">
                To enable email notifications, configure these environment variables:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
                <li>
                  <code className="rounded bg-blue-100 px-1 py-0.5">EMAIL_FROM</code> - Sender email address
                </li>
                <li>
                  <code className="rounded bg-blue-100 px-1 py-0.5">EMAIL_REPLY_TO</code> - Reply-to address (optional)
                </li>
                <li>
                  <code className="rounded bg-blue-100 px-1 py-0.5">ADMIN_EMAILS</code> - Default recipient emails
                  (comma-separated)
                </li>
              </ul>
              <p className="mt-2 text-sm text-blue-800">
                You&apos;ll also need to integrate an email service provider (Resend, SendGrid, etc.) in{" "}
                <code className="rounded bg-blue-100 px-1 py-0.5">src/lib/email-notifications.ts</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>Advanced inventory management settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Default Threshold</Label>
                <p className="text-2xl font-bold">{settings.defaultThreshold} units</p>
                <p className="text-muted-foreground text-xs">For new products</p>
              </div>

              <div className="space-y-2">
                <Label>Critical Threshold</Label>
                <p className="text-2xl font-bold">{settings.criticalThreshold} units</p>
                <p className="text-muted-foreground text-xs">Requires immediate action</p>
              </div>

              <div className="space-y-2">
                <Label>Check Frequency</Label>
                <p className="text-2xl font-bold">
                  {settings.checkInterval < 60
                    ? `${settings.checkInterval}m`
                    : `${(settings.checkInterval / 60).toFixed(1)}h`}
                </p>
                <p className="text-muted-foreground text-xs">Stock monitoring interval</p>
              </div>
            </div>

            <Separator />

            <div className="rounded-lg border bg-gray-50 p-4">
              <h4 className="mb-2 font-semibold text-gray-900">Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Stock Alerts</span>
                  <span className={`font-medium ${settings.enableAlerts ? "text-green-600" : "text-gray-500"}`}>
                    {settings.enableAlerts ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Email Notifications</span>
                  <span className={`font-medium ${settings.enableEmailAlerts ? "text-green-600" : "text-gray-500"}`}>
                    {settings.enableEmailAlerts ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Configured Recipients</span>
                  <span className="font-medium text-gray-900">
                    {settings.alertEmails ? settings.alertEmails.split(",").length : 0} email
                    {settings.alertEmails && settings.alertEmails.split(",").length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        <p className="text-muted-foreground text-sm">Changes take effect immediately after saving</p>
      </div>
    </div>
  );
}
