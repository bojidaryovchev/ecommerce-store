"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange as DateRangeType } from "@/lib/analytics-utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

interface AnalyticsDateRangeSelectorProps {
  value: DateRangeType;
  onChange: (range: DateRangeType) => void;
  preset?: string;
  onPresetChange?: (preset: string) => void;
}

const PRESET_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "last90days", label: "Last 90 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

export function AnalyticsDateRangeSelector({
  value,
  onChange,
  preset = "last30days",
  onPresetChange,
}: AnalyticsDateRangeSelectorProps) {
  const [currentPreset, setCurrentPreset] = useState(preset);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const handlePresetChange = (newPreset: string) => {
    setCurrentPreset(newPreset);
    onPresetChange?.(newPreset);
    if (newPreset === "custom") {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
    }
  };

  const handleCustomDateChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to });
    }
  };

  const formatDateRange = (range: DateRangeType) => {
    if (currentPreset !== "custom") {
      return PRESET_OPTIONS.find((opt) => opt.value === currentPreset)?.label || "Select range";
    }
    return `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESET_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentPreset === "custom" && (
        <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-[280px] justify-start text-left font-normal", !value && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? formatDateRange(value) : <span>Pick a date range</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value.from}
              selected={{ from: value.from, to: value.to }}
              onSelect={handleCustomDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
