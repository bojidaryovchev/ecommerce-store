import { getStockAlertSummary } from "@/actions/get-low-stock-items.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStockStatusColor, getStockStatusLabel } from "@/lib/stock-monitor";
import { AlertTriangle, ArrowRight, Package, TrendingDown } from "lucide-react";
import Link from "next/link";

/**
 * Low Stock Alert Widget for Admin Dashboard
 * Displays summary of inventory items that need attention
 */
export async function LowStockWidget() {
  const result = await getStockAlertSummary();

  if (!result.success || !result.summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Unable to load inventory alerts</p>
        </CardContent>
      </Card>
    );
  }

  const { summary } = result;
  const hasAlerts = summary.needsAttention > 0;

  return (
    <Card className={hasAlerts ? "border-amber-500/50" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventory Alerts
          {hasAlerts && (
            <Badge variant="destructive" className="ml-auto">
              {summary.needsAttention} Need Attention
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {hasAlerts ? "Items requiring immediate restock or attention" : "All inventory levels are healthy"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          {/* Out of Stock */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground text-xs font-medium">Out of Stock</span>
            </div>
            <p className="text-2xl font-bold">{summary.outOfStock}</p>
          </div>

          {/* Critical */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground text-xs font-medium">Critical</span>
            </div>
            <p className="text-2xl font-bold">{summary.criticalItems}</p>
          </div>

          {/* Low Stock */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground text-xs font-medium">Low Stock</span>
            </div>
            <p className="text-2xl font-bold">{summary.totalLowStock}</p>
          </div>
        </div>

        {/* Recently Updated Items */}
        {summary.recentlyUpdated.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingDown className="text-muted-foreground h-4 w-4" />
              <span>Recently Updated</span>
            </div>

            <div className="space-y-2">
              {summary.recentlyUpdated.slice(0, 3).map((item) => {
                const color = getStockStatusColor(item.status);
                const label = getStockStatusLabel(item.status);

                return (
                  <Link
                    key={item.id}
                    href={`/admin/products/${item.productId}`}
                    className="hover:bg-accent block rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm leading-none font-medium">{item.productName}</p>
                        {item.variantId && <p className="text-muted-foreground text-xs">Variant: {item.variantId}</p>}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="outline"
                          className={`border-${color}-500/50 bg-${color}-500/10 text-${color}-700`}
                        >
                          {label}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {item.stockQuantity} / {item.threshold}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Alert Messages */}
        {hasAlerts && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-amber-900">Action Required</p>
                <p className="text-xs text-amber-700">
                  {summary.criticalItems > 0 &&
                    `${summary.criticalItems} critical item${summary.criticalItems > 1 ? "s" : ""}`}
                  {summary.criticalItems > 0 && summary.outOfStock > 0 && " and "}
                  {summary.outOfStock > 0 &&
                    `${summary.outOfStock} out of stock item${summary.outOfStock > 1 ? "s" : ""}`}{" "}
                  need immediate attention.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Alerts Message */}
        {!hasAlerts && (
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <p className="text-sm font-medium text-green-900">All inventory levels are healthy</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="default" size="sm" className="flex-1">
            <Link href="/admin/inventory">
              View Inventory
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          {hasAlerts && (
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/inventory?filter=low-stock">View Alerts</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
