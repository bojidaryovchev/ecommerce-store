"use client";

import { getOrdersForExport } from "@/actions/export-orders.action";
import OrderFilters from "@/components/order-filters";
import OrderSearchBar from "@/components/order-search-bar";
import OrdersList from "@/components/orders-list";
import { Button } from "@/components/ui/button";
import { downloadCSV, generateCSVFilename, ordersToCSV } from "@/lib/csv-export";
import type { OrderFilterData } from "@/schemas/order.schema";
import { Download, Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

const OrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Partial<OrderFilterData>>({});
  const [isExporting, setIsExporting] = useState(false);

  const handleFiltersChange = (newFilters: Partial<OrderFilterData>) => {
    setFilters(newFilters);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Merge search query with filters (same logic as OrdersList)
      const isEmail = searchQuery.includes("@");
      const searchFilters = searchQuery
        ? {
            ...(isEmail ? { customerEmail: searchQuery } : { orderNumber: searchQuery }),
          }
        : {};

      const mergedFilters = {
        ...filters,
        ...searchFilters,
      };

      // Fetch all orders matching current filters
      const orders = await getOrdersForExport(mergedFilters);

      if (orders.length === 0) {
        toast.error("No orders to export");
        return;
      }

      // Convert to CSV and download
      const csvContent = ordersToCSV(orders);
      const filename = generateCSVFilename("orders");
      downloadCSV(csvContent, filename);

      toast.success(`Exported ${orders.length} orders successfully`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export orders");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-2">Manage and track customer orders</p>
        </div>
        <Button onClick={handleExportCSV} disabled={isExporting} variant="outline">
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </>
          )}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <OrderSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <OrderFilters filters={filters} onFiltersChange={handleFiltersChange} />
      </div>

      {/* Orders List */}
      <OrdersList searchQuery={searchQuery} filters={filters} onFiltersChange={handleFiltersChange} />
    </div>
  );
};

export default OrdersPage;
