"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertTriangle,
  Download,
  Edit,
  Filter,
  Package,
  PackageX,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { adjustVariantStock } from "@/actions/adjust-variant-stock.action";
import {
  getLowStockCountsAction,
  getLowStockItems,
  updateProductStockThreshold,
} from "@/actions/get-low-stock-items.action";
import { getStockStatusColor, getStockStatusLabel, type LowStockItem } from "@/lib/stock-monitor";

type FilterType = "all" | "low-stock" | "critical" | "out-of-stock" | "products" | "variants";

interface StockCounts {
  total: number;
  low: number;
  critical: number;
  outOfStock: number;
  products: number;
  variants: number;
}

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") as FilterType | null;

  const [items, setItems] = useState<LowStockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LowStockItem[]>([]);
  const [counts, setCounts] = useState<StockCounts>({
    total: 0,
    low: 0,
    critical: 0,
    outOfStock: 0,
    products: 0,
    variants: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>(filterParam || "all");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit dialogs
  const [editingItem, setEditingItem] = useState<LowStockItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>("");
  const [newThreshold, setNewThreshold] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Load inventory data
  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsResult, countsResult] = await Promise.all([
        getLowStockItems({ includeOutOfStock: true }),
        getLowStockCountsAction(),
      ]);

      if (itemsResult.success && itemsResult.items) {
        setItems(itemsResult.items);
        setFilteredItems(itemsResult.items);
      }

      if (countsResult.success && countsResult.counts) {
        const { low, critical, outOfStock, byType } = countsResult.counts;
        setCounts({
          total: low + critical + outOfStock,
          low,
          critical,
          outOfStock,
          products: byType.products,
          variants: byType.variants,
        });
      }
    } catch (error) {
      console.error("Failed to load inventory:", error);
      alert("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...items];

    // Apply status filter
    switch (filter) {
      case "low-stock":
        filtered = filtered.filter((item) => item.status === "low-stock");
        break;
      case "critical":
        filtered = filtered.filter((item) => item.status === "critical");
        break;
      case "out-of-stock":
        filtered = filtered.filter((item) => item.status === "out-of-stock");
        break;
      case "products":
        filtered = filtered.filter((item) => item.type === "product");
        break;
      case "variants":
        filtered = filtered.filter((item) => item.type === "variant");
        break;
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((item) => item.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    setFilteredItems(filtered);
  }, [filter, searchQuery, items]);

  // Handle stock adjustment
  const handleAdjustStock = async () => {
    if (!editingItem || !adjustmentAmount) return;

    setSubmitting(true);
    try {
      const adjustment = parseInt(adjustmentAmount, 10);

      if (isNaN(adjustment)) {
        alert("Please enter a valid number");
        return;
      }

      if (editingItem.type === "variant" && editingItem.variantId) {
        const result = await adjustVariantStock({
          id: editingItem.variantId,
          adjustment,
          reason: "Manual stock adjustment from inventory page",
        });

        if (result.success) {
          alert(`Stock ${adjustment > 0 ? "increased" : "decreased"} by ${Math.abs(adjustment)}`);
          setEditingItem(null);
          setAdjustmentAmount("");
          await loadData();
        } else {
          alert(result.error || "Failed to adjust stock");
        }
      } else {
        alert("Stock adjustment is only available for variants");
      }
    } catch (error) {
      console.error("Failed to adjust stock:", error);
      alert("Failed to adjust stock");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle threshold update
  const handleUpdateThreshold = async () => {
    if (!editingItem || !newThreshold) return;

    setSubmitting(true);
    try {
      const threshold = parseInt(newThreshold, 10);

      if (isNaN(threshold) || threshold < 0) {
        alert("Please enter a valid threshold (0 or greater)");
        return;
      }

      const result = await updateProductStockThreshold({
        productId: editingItem.productId,
        threshold,
      });

      if (result.success) {
        alert("Stock threshold updated");
        setEditingItem(null);
        setNewThreshold("");
        await loadData();
      } else {
        alert(result.error || "Failed to update threshold");
      }
    } catch (error) {
      console.error("Failed to update threshold:", error);
      alert("Failed to update threshold");
    } finally {
      setSubmitting(false);
    }
  };

  // Export data
  const handleExport = () => {
    const csv = [
      ["Type", "Product Name", "Variant ID", "Current Stock", "Threshold", "Status"].join(","),
      ...filteredItems.map((item) =>
        [
          item.type,
          `"${item.productName}"`,
          item.variantId || "",
          item.stockQuantity,
          item.threshold,
          item.status,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    alert("Inventory exported");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">Monitor and manage product and variant stock levels</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
            <p className="text-muted-foreground text-xs">Need attention</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{counts.low}</div>
            <p className="text-muted-foreground text-xs">Below threshold</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{counts.critical}</div>
            <p className="text-muted-foreground text-xs">Immediate action</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <PackageX className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{counts.outOfStock}</div>
            <p className="text-muted-foreground text-xs">No stock available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.products}</div>
            <p className="text-muted-foreground text-xs">With issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.variants}</div>
            <p className="text-muted-foreground text-xs">With issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="text-muted-foreground h-4 w-4" />
              <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items ({counts.total})</SelectItem>
                  <SelectItem value="low-stock">Low Stock ({counts.low})</SelectItem>
                  <SelectItem value="critical">Critical ({counts.critical})</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock ({counts.outOfStock})</SelectItem>
                  <SelectItem value="products">Products ({counts.products})</SelectItem>
                  <SelectItem value="variants">Variants ({counts.variants})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1 sm:max-w-sm">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm">Loading inventory...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="text-muted-foreground mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No items found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? "Try adjusting your search query" : "All inventory levels are healthy!"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Current Stock</TableHead>
                    <TableHead className="text-center">Threshold</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const color = getStockStatusColor(item.status);
                    const label = getStockStatusLabel(item.status);

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <Link href={`/admin/products/${item.productId}`} className="font-medium hover:underline">
                              {item.productName}
                            </Link>
                            {item.variantId && (
                              <p className="text-muted-foreground text-xs">Variant: {item.variantId}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono">{item.stockQuantity}</TableCell>
                        <TableCell className="text-center font-mono">{item.threshold}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`border-${color}-500/50 bg-${color}-500/10 text-${color}-700`}
                          >
                            {label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {item.type === "variant" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingItem(item);
                                  setAdjustmentAmount("");
                                }}
                              >
                                <Edit className="mr-1 h-3 w-3" />
                                Adjust
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingItem(item);
                                setNewThreshold(item.threshold.toString());
                              }}
                            >
                              Threshold
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog
        open={editingItem !== null && adjustmentAmount !== null && newThreshold === ""}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
            setAdjustmentAmount("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Adjust the stock quantity for {editingItem?.productName}
              {editingItem?.variantId && ` (Variant: ${editingItem.variantId})`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Stock</Label>
              <div className="text-2xl font-bold">{editingItem?.stockQuantity} units</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustment">Adjustment Amount</Label>
              <Input
                id="adjustment"
                type="number"
                placeholder="Enter positive or negative number"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Use positive numbers to increase stock, negative to decrease
              </p>
            </div>

            {adjustmentAmount && editingItem && (
              <div className="bg-muted rounded-lg border p-3">
                <p className="text-sm">
                  New Stock:{" "}
                  <span className="font-bold">
                    {editingItem.stockQuantity + parseInt(adjustmentAmount || "0", 10)} units
                  </span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAdjustStock} disabled={submitting || !adjustmentAmount}>
              {submitting ? "Adjusting..." : "Adjust Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Threshold Update Dialog */}
      <Dialog
        open={editingItem !== null && newThreshold !== ""}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
            setNewThreshold("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock Threshold</DialogTitle>
            <DialogDescription>Set the low stock threshold for {editingItem?.productName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Threshold</Label>
              <div className="text-2xl font-bold">{editingItem?.threshold} units</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">New Threshold</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                placeholder="Enter new threshold"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">You&apos;ll be alerted when stock falls below this number</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateThreshold} disabled={submitting || !newThreshold}>
              {submitting ? "Updating..." : "Update Threshold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
