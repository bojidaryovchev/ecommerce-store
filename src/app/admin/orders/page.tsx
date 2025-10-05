"use client";

import OrderFilters from "@/components/order-filters";
import OrderSearchBar from "@/components/order-search-bar";
import OrdersList from "@/components/orders-list";
import type { OrderFilterData } from "@/schemas/order.schema";
import type React from "react";
import { useState } from "react";

const OrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Partial<OrderFilterData>>({});

  const handleFiltersChange = (newFilters: Partial<OrderFilterData>) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-2">Manage and track customer orders</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <OrderSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <OrderFilters filters={filters} onFiltersChange={handleFiltersChange} />
      </div>

      {/* Orders List */}
      <OrdersList searchQuery={searchQuery} filters={filters} />
    </div>
  );
};

export default OrdersPage;
