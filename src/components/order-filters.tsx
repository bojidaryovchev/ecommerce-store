"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from "@/lib/order-utils";
import { cn } from "@/lib/utils";
import type { OrderFilterData } from "@/schemas/order.schema";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { format } from "date-fns";
import { CalendarIcon, Filter, X } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface OrderFiltersProps {
  filters: Partial<OrderFilterData>;
  onFiltersChange: (filters: Partial<OrderFilterData>) => void;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({ filters, onFiltersChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusToggle = (status: OrderStatus) => {
    const currentStatuses = filters.status ? [filters.status] : [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses[0] : undefined,
    });
  };

  const handlePaymentStatusToggle = (status: PaymentStatus) => {
    const currentStatuses = filters.paymentStatus ? [filters.paymentStatus] : [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onFiltersChange({
      ...filters,
      paymentStatus: newStatuses.length > 0 ? newStatuses[0] : undefined,
    });
  };

  const handleDateSelect = (field: "startDate" | "endDate", date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      [field]: date,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      page: filters.page,
      limit: filters.limit,
    });
    setIsOpen(false);
  };

  const activeFilterCount =
    (filters.status ? 1 : 0) +
    (filters.paymentStatus ? 1 : 0) +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 h-5 min-w-5 rounded-full px-1.5" variant="default">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px]" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Filter Orders</h4>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear All
              </Button>
            )}
          </div>

          {/* Order Status Filter */}
          <div className="space-y-2">
            <Label>Order Status</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ORDER_STATUS_CONFIG).map(([status, config]) => {
                const isSelected = filters.status === status;
                return (
                  <Badge
                    key={status}
                    className={cn(
                      "cursor-pointer transition-all hover:opacity-80",
                      isSelected ? config.color : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    )}
                    onClick={() => handleStatusToggle(status as OrderStatus)}
                  >
                    {config.label}
                    {isSelected && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-2">
            <Label>Payment Status</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PAYMENT_STATUS_CONFIG).map(([status, config]) => {
                const isSelected = filters.paymentStatus === status;
                return (
                  <Badge
                    key={status}
                    className={cn(
                      "cursor-pointer transition-all hover:opacity-80",
                      isSelected ? config.color : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    )}
                    onClick={() => handlePaymentStatusToggle(status as PaymentStatus)}
                  >
                    {config.label}
                    {isSelected && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="grid gap-2">
              {/* Start Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("justify-start text-left font-normal", !filters.startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, "PPP") : "Start date"}
                    {filters.startDate && (
                      <X
                        className="ml-auto h-4 w-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDateSelect("startDate", undefined);
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => handleDateSelect("startDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* End Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("justify-start text-left font-normal", !filters.endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, "PPP") : "End date"}
                    {filters.endDate && (
                      <X
                        className="ml-auto h-4 w-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDateSelect("endDate", undefined);
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => handleDateSelect("endDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default OrderFilters;
