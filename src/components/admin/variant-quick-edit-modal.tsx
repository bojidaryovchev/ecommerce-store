"use client";

import { bulkAdjustVariantStock } from "@/actions/adjust-variant-stock.action";
import { updateVariant } from "@/actions/update-variant.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProductVariant } from "@prisma/client";
import { DollarSign, Loader2, Package } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface VariantQuickEditModalProps {
  productId: string;
  variants: ProductVariant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface VariantEdit {
  id: string;
  price?: number;
  stockQuantity?: number;
}

export function VariantQuickEditModal({ variants, open, onOpenChange, onSuccess }: VariantQuickEditModalProps) {
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Map<string, VariantEdit>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"price" | "stock">("price");

  // Bulk adjustment values
  const [bulkPriceAdjustment, setBulkPriceAdjustment] = useState<number>(0);
  const [bulkPriceMode, setBulkPriceMode] = useState<"set" | "increase" | "decrease">("set");
  const [bulkStockAdjustment, setBulkStockAdjustment] = useState<number>(0);
  const [bulkStockMode, setBulkStockMode] = useState<"set" | "increase" | "decrease">("set");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedVariantIds(new Set());
      setEdits(new Map());
      setBulkPriceAdjustment(0);
      setBulkStockAdjustment(0);
    }
  }, [open]);

  // Toggle variant selection
  const toggleVariant = (variantId: string) => {
    const newSelected = new Set(selectedVariantIds);
    if (newSelected.has(variantId)) {
      newSelected.delete(variantId);
    } else {
      newSelected.add(variantId);
    }
    setSelectedVariantIds(newSelected);
  };

  // Select all variants
  const selectAll = () => {
    setSelectedVariantIds(new Set(variants.map((v) => v.id)));
  };

  // Deselect all variants
  const deselectAll = () => {
    setSelectedVariantIds(new Set());
  };

  // Update individual variant edit
  const updateEdit = (variantId: string, field: "price" | "stockQuantity", value: number) => {
    const newEdits = new Map(edits);
    const existing = newEdits.get(variantId) || { id: variantId };
    existing[field] = value;
    newEdits.set(variantId, existing);
    setEdits(newEdits);
  };

  // Apply bulk price adjustment
  const applyBulkPriceAdjustment = () => {
    if (selectedVariantIds.size === 0) {
      toast.error("Please select at least one variant");
      return;
    }

    const newEdits = new Map(edits);
    selectedVariantIds.forEach((variantId) => {
      const variant = variants.find((v) => v.id === variantId);
      if (!variant) return;

      let newPrice = Number(variant.price);
      if (bulkPriceMode === "set") {
        newPrice = bulkPriceAdjustment;
      } else if (bulkPriceMode === "increase") {
        newPrice += bulkPriceAdjustment;
      } else if (bulkPriceMode === "decrease") {
        newPrice = Math.max(0, newPrice - bulkPriceAdjustment);
      }

      const existing = newEdits.get(variantId) || { id: variantId };
      existing.price = newPrice;
      newEdits.set(variantId, existing);
    });

    setEdits(newEdits);
    toast.success(`Applied price adjustment to ${selectedVariantIds.size} variants`);
  };

  // Apply bulk stock adjustment
  const applyBulkStockAdjustment = () => {
    if (selectedVariantIds.size === 0) {
      toast.error("Please select at least one variant");
      return;
    }

    const newEdits = new Map(edits);
    selectedVariantIds.forEach((variantId) => {
      const variant = variants.find((v) => v.id === variantId);
      if (!variant) return;

      let newStock = variant.stockQuantity;
      if (bulkStockMode === "set") {
        newStock = bulkStockAdjustment;
      } else if (bulkStockMode === "increase") {
        newStock += bulkStockAdjustment;
      } else if (bulkStockMode === "decrease") {
        newStock = Math.max(0, newStock - bulkStockAdjustment);
      }

      const existing = newEdits.get(variantId) || { id: variantId };
      existing.stockQuantity = newStock;
      newEdits.set(variantId, existing);
    });

    setEdits(newEdits);
    toast.success(`Applied stock adjustment to ${selectedVariantIds.size} variants`);
  };

  // Save all changes
  const handleSave = async () => {
    if (edits.size === 0) {
      toast.error("No changes to save");
      return;
    }

    setIsSubmitting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Process each edit
      for (const [variantId, edit] of edits.entries()) {
        try {
          // Update price if changed
          if (edit.price !== undefined) {
            const result = await updateVariant({
              id: variantId,
              price: edit.price,
            });
            if (!result.success) {
              errorCount++;
              console.error(`Failed to update variant ${variantId}:`, result.error);
              continue;
            }
          }

          // Update stock if changed (use bulk adjust action)
          if (edit.stockQuantity !== undefined) {
            const variant = variants.find((v) => v.id === variantId);
            if (variant) {
              const result = await bulkAdjustVariantStock({
                adjustments: [
                  {
                    id: variantId,
                    newQuantity: edit.stockQuantity,
                  },
                ],
              });
              if (!result.success) {
                errorCount++;
                console.error(`Failed to update stock for variant ${variantId}:`, result.error);
                continue;
              }
            }
          }

          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error updating variant ${variantId}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} variant${successCount === 1 ? "" : "s"}`);
        onSuccess?.();
        onOpenChange(false);
      }

      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} variant${errorCount === 1 ? "" : "s"}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = edits.size > 0;
  const selectedCount = selectedVariantIds.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Quick Edit Variants</DialogTitle>
          <DialogDescription>Update prices and stock quantities for multiple variants at once</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "price" | "stock")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="price">
              <DollarSign className="mr-2 h-4 w-4" />
              Price Adjustments
            </TabsTrigger>
            <TabsTrigger value="stock">
              <Package className="mr-2 h-4 w-4" />
              Stock Adjustments
            </TabsTrigger>
          </TabsList>

          {/* Price Adjustments Tab */}
          <TabsContent value="price" className="space-y-4">
            {/* Bulk Price Controls */}
            <div className="space-y-3 rounded-lg border p-4">
              <Label className="text-sm font-semibold">Bulk Price Adjustment</Label>
              <div className="flex gap-2">
                <select
                  value={bulkPriceMode}
                  onChange={(e) => setBulkPriceMode(e.target.value as "set" | "increase" | "decrease")}
                  className="rounded-md border px-3 py-2"
                >
                  <option value="set">Set to</option>
                  <option value="increase">Increase by</option>
                  <option value="decrease">Decrease by</option>
                </select>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={bulkPriceAdjustment}
                  onChange={(e) => setBulkPriceAdjustment(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="flex-1"
                />
                <Button onClick={applyBulkPriceAdjustment} variant="outline">
                  Apply to {selectedCount} selected
                </Button>
              </div>
            </div>

            {/* Variants Table */}
            <VariantsTable
              variants={variants}
              selectedIds={selectedVariantIds}
              edits={edits}
              onToggle={toggleVariant}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              onUpdateEdit={updateEdit}
              editField="price"
            />
          </TabsContent>

          {/* Stock Adjustments Tab */}
          <TabsContent value="stock" className="space-y-4">
            {/* Bulk Stock Controls */}
            <div className="space-y-3 rounded-lg border p-4">
              <Label className="text-sm font-semibold">Bulk Stock Adjustment</Label>
              <div className="flex gap-2">
                <select
                  value={bulkStockMode}
                  onChange={(e) => setBulkStockMode(e.target.value as "set" | "increase" | "decrease")}
                  className="rounded-md border px-3 py-2"
                >
                  <option value="set">Set to</option>
                  <option value="increase">Increase by</option>
                  <option value="decrease">Decrease by</option>
                </select>
                <Input
                  type="number"
                  min="0"
                  value={bulkStockAdjustment}
                  onChange={(e) => setBulkStockAdjustment(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="flex-1"
                />
                <Button onClick={applyBulkStockAdjustment} variant="outline">
                  Apply to {selectedCount} selected
                </Button>
              </div>
            </div>

            {/* Variants Table */}
            <VariantsTable
              variants={variants}
              selectedIds={selectedVariantIds}
              edits={edits}
              onToggle={toggleVariant}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              onUpdateEdit={updateEdit}
              editField="stockQuantity"
            />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-muted-foreground text-sm">
            {hasChanges && (
              <span>
                {edits.size} variant{edits.size === 1 ? "" : "s"} modified
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Variants table component
interface VariantsTableProps {
  variants: ProductVariant[];
  selectedIds: Set<string>;
  edits: Map<string, VariantEdit>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onUpdateEdit: (id: string, field: "price" | "stockQuantity", value: number) => void;
  editField: "price" | "stockQuantity";
}

function VariantsTable({
  variants,
  selectedIds,
  edits,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onUpdateEdit,
  editField,
}: VariantsTableProps) {
  const allSelected = variants.length > 0 && selectedIds.size === variants.length;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => {
                  if (checked) onSelectAll();
                  else onDeselectAll();
                }}
              />
            </TableHead>
            <TableHead>Variant</TableHead>
            <TableHead>Options</TableHead>
            <TableHead>Current</TableHead>
            <TableHead>New Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((variant) => {
            const isSelected = selectedIds.has(variant.id);
            const edit = edits.get(variant.id);
            const currentValue = editField === "price" ? Number(variant.price) : variant.stockQuantity;
            const newValue = edit?.[editField];
            const hasChange = newValue !== undefined;

            return (
              <TableRow key={variant.id} className={hasChange ? "bg-blue-50" : undefined}>
                <TableCell>
                  <Checkbox checked={isSelected} onCheckedChange={() => onToggle(variant.id)} />
                </TableCell>
                <TableCell className="font-medium">{variant.name}</TableCell>
                <TableCell>
                  {variant.options ? (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(variant.options as Record<string, string>).map(([name, value]) => (
                        <Badge key={name} variant="outline" className="text-xs">
                          {name}: {value}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No options</span>
                  )}
                </TableCell>
                <TableCell>{editField === "price" ? `$${currentValue.toFixed(2)}` : currentValue}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step={editField === "price" ? "0.01" : "1"}
                    min="0"
                    value={newValue ?? ""}
                    onChange={(e) => {
                      const value =
                        editField === "price" ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0;
                      onUpdateEdit(variant.id, editField, value);
                    }}
                    placeholder={currentValue.toString()}
                    className="w-24"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
