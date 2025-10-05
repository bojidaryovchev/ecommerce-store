"use client";

import {
  cleanupOldAbandonedCarts,
  detectAndMarkAbandonedCarts,
  getAbandonedCarts,
  getAbandonedCartStats,
  sendRecoveryEmail,
} from "@/actions/abandoned-cart.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/analytics-utils";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  Mail,
  RefreshCw,
  ShoppingCart,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AbandonedCart {
  id: string;
  cartId: string;
  userEmail: string;
  userName: string | null;
  itemCount: number;
  cartTotal: number;
  remindersSent: number;
  lastReminderSent: Date | null;
  isRecovered: boolean;
  recoveredAt: Date | null;
  orderCreated: boolean | null;
  orderId: string | null;
  recoveryChannel: string | null;
  abandonedAt: Date;
  recoveryToken: string;
}

interface Stats {
  totalAbandoned: number;
  recovered: number;
  recoveryRate: number;
  ordersCreated: number;
  conversionRate: number;
  revenueRecovered: number;
  totalCarts: number;
  avgCartValue: number;
  recoveredValue: number;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export default function AbandonedCartsAdminPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "recovered">("all");
  const [dateRange, setDateRange] = useState<"7days" | "30days" | "90days">("30days");
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch carts
      const cartsResult = await getAbandonedCarts({
        status: statusFilter,
      });

      if (cartsResult.success && cartsResult.data) {
        setCarts(cartsResult.data as AbandonedCart[]);
      }

      // Fetch stats
      const now = new Date();
      const days = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 90;
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);

      const statsResult = await getAbandonedCartStats(startDate, now);
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data as Stats);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load abandoned carts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleDetectCarts = async () => {
    setIsDetecting(true);
    try {
      const result = await detectAndMarkAbandonedCarts();
      if (result.success && result.data) {
        toast.success(`Detected ${result.data.detected} abandoned carts`);
        await fetchData();
      } else {
        toast.error(result.error || "Failed to detect abandoned carts");
      }
    } catch (error) {
      console.error("Detection failed:", error);
      toast.error("Failed to detect abandoned carts");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSendEmail = async (cartId: string) => {
    setSendingEmailId(cartId);
    try {
      const result = await sendRecoveryEmail(cartId);
      if (result.success) {
        toast.success(result.message || "Recovery email sent");
        await fetchData();
      } else {
        toast.error(result.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Send email failed:", error);
      toast.error("Failed to send recovery email");
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleCleanup = async () => {
    if (!confirm("Delete abandoned cart records older than 90 days? This cannot be undone.")) {
      return;
    }

    setIsCleaning(true);
    try {
      const result = await cleanupOldAbandonedCarts(90);
      if (result.success) {
        toast.success(result.message || "Cleanup completed");
        await fetchData();
      } else {
        toast.error(result.error || "Failed to cleanup");
      }
    } catch (error) {
      console.error("Cleanup failed:", error);
      toast.error("Failed to cleanup old records");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Email", "Name", "Items", "Total", "Reminders", "Status", "Abandoned At", "Recovered At"].join(","),
      ...carts.map((cart) =>
        [
          cart.userEmail,
          cart.userName || "",
          cart.itemCount,
          cart.cartTotal,
          cart.remindersSent,
          cart.isRecovered ? "Recovered" : "Pending",
          new Date(cart.abandonedAt).toLocaleDateString(),
          cart.recoveredAt ? new Date(cart.recoveredAt).toLocaleDateString() : "",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abandoned-carts-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Exported to CSV");
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateRange]);

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  const getReminderBadgeColor = (count: number) => {
    if (count === 0) return "bg-gray-100 text-gray-800";
    if (count === 1) return "bg-blue-100 text-blue-800";
    if (count === 2) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Abandoned Carts</h1>
          <p className="text-muted-foreground mt-2">Monitor and recover abandoned shopping carts</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDetectCarts} disabled={isDetecting} variant="outline" size="sm">
            {isDetecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Detect Now
              </>
            )}
          </Button>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Abandoned</CardTitle>
              <ShoppingCart className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCarts}</div>
              <p className="text-muted-foreground text-xs">
                Last {dateRange === "7days" ? "7" : dateRange === "30days" ? "30" : "90"} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recoveryRate.toFixed(1)}%</div>
              <p className="text-muted-foreground text-xs">
                {stats.recovered} of {stats.totalAbandoned} recovered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <CheckCircle2 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
              <p className="text-muted-foreground text-xs">{stats.ordersCreated} orders created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Recovered</CardTitle>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.recoveredValue)}</div>
              <p className="text-muted-foreground text-xs">Avg: {formatCurrency(stats.avgCartValue)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carts</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="recovered">Recovered</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={(value) => setDateRange(value as typeof dateRange)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={carts.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleCleanup} variant="outline" size="sm" disabled={isCleaning}>
            {isCleaning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cleaning...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Cleanup Old
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Carts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Abandoned Carts ({carts.length})</CardTitle>
          <CardDescription>View and manage all abandoned shopping carts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : carts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">No Abandoned Carts</h3>
              <p className="text-muted-foreground text-sm">There are no abandoned carts matching your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pr-4 pb-3 font-medium">Customer</th>
                    <th className="pr-4 pb-3 font-medium">Items</th>
                    <th className="pr-4 pb-3 font-medium">Total</th>
                    <th className="pr-4 pb-3 font-medium">Reminders</th>
                    <th className="pr-4 pb-3 font-medium">Status</th>
                    <th className="pr-4 pb-3 font-medium">Abandoned</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {carts.map((cart) => (
                    <tr key={cart.id} className="text-sm">
                      <td className="py-4 pr-4">
                        <div>
                          <div className="font-medium">{cart.userName || "Guest"}</div>
                          <div className="text-muted-foreground text-xs">{cart.userEmail}</div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">{cart.itemCount}</td>
                      <td className="py-4 pr-4 font-medium">{formatCurrency(cart.cartTotal)}</td>
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getReminderBadgeColor(cart.remindersSent)}`}
                        >
                          {cart.remindersSent}/3
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        {cart.isRecovered ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Recovered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                            <AlertCircle className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="text-muted-foreground py-4 pr-4 text-xs">{formatDate(cart.abandonedAt)}</td>
                      <td className="py-4">
                        {!cart.isRecovered && cart.remindersSent < 3 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendEmail(cart.id)}
                            disabled={sendingEmailId === cart.id}
                          >
                            {sendingEmailId === cart.id ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Mail className="mr-1 h-3 w-3" />
                                Send Email
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
