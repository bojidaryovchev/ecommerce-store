"use client";

import { generateVariants, previewVariantCombinations } from "@/actions/generate-variants.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface OptionType {
  name: string;
  values: string[];
}

interface PreviewVariant {
  name: string;
  sku: string | null;
  options: Record<string, string>;
  price: number | null | undefined;
  stockQuantity: number;
  alreadyExists: boolean;
}

interface BulkVariantGeneratorProps {
  productId: string;
  productSku?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function BulkVariantGenerator({
  productId,
  productSku = "",
  onSuccess,
  onCancel,
  className,
}: BulkVariantGeneratorProps) {
  const [optionTypes, setOptionTypes] = useState<OptionType[]>([{ name: "", values: [] }]);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [baseStock, setBaseStock] = useState<number>(0);
  const [skuPattern, setSkuPattern] = useState<string>(productSku ? `${productSku}-{0}-{1}` : "{BASE}-{0}-{1}");
  const [preview, setPreview] = useState<PreviewVariant[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Add a new option type
  const handleAddOptionType = () => {
    setOptionTypes([...optionTypes, { name: "", values: [] }]);
  };

  // Remove an option type
  const handleRemoveOptionType = (index: number) => {
    setOptionTypes(optionTypes.filter((_, i) => i !== index));
    setPreview(null); // Clear preview when options change
  };

  // Update option type name
  const handleOptionNameChange = (index: number, name: string) => {
    const updated = [...optionTypes];
    updated[index].name = name;
    setOptionTypes(updated);
    setPreview(null);
  };

  // Update option type values
  const handleOptionValuesChange = (index: number, valuesString: string) => {
    const updated = [...optionTypes];
    updated[index].values = valuesString
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    setOptionTypes(updated);
    setPreview(null);
  };

  // Generate preview of variants
  const handlePreview = async () => {
    // Validate option types
    const validOptions = optionTypes.filter((opt) => opt.name && opt.values.length > 0);

    if (validOptions.length === 0) {
      toast.error("Please add at least one option type with values");
      return;
    }

    setIsPreviewing(true);
    try {
      const result = await previewVariantCombinations({
        productId,
        optionTypes: validOptions,
        basePrice,
        baseStockQuantity: baseStock,
        autoGenerateSku: true,
        skuPattern: skuPattern || undefined,
      });

      if (result.success && result.preview) {
        setPreview(result.preview);

        if (result.totalCombinations === 0) {
          toast.error("No new combinations to generate");
        } else if (result.existingVariants > 0) {
          toast.success(
            `Preview generated: ${result.newVariants} new variants (${result.existingVariants} already exist)`,
          );
        } else {
          toast.success(`Preview generated: ${result.newVariants} new variants`);
        }
      } else {
        toast.error(result.error || "Failed to generate preview");
      }
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Failed to generate preview");
    } finally {
      setIsPreviewing(false);
    }
  };

  // Generate variants from preview
  const handleGenerate = async () => {
    if (!preview) {
      toast.error("Please preview variants first");
      return;
    }

    const validOptions = optionTypes.filter((opt) => opt.name && opt.values.length > 0);

    setIsGenerating(true);
    try {
      const result = await generateVariants({
        productId,
        optionTypes: validOptions,
        basePrice,
        baseStockQuantity: baseStock,
        autoGenerateSku: true,
        skuPattern: skuPattern || undefined,
      });

      if (result.success) {
        toast.success(result.message || `Successfully generated ${result.count} variants`);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to generate variants");
      }
    } catch (error) {
      console.error("Generate error:", error);
      toast.error("Failed to generate variants");
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate total combinations
  const getTotalCombinations = () => {
    const validOptions = optionTypes.filter((opt) => opt.name && opt.values.length > 0);
    if (validOptions.length === 0) return 0;
    return validOptions.reduce((total, opt) => total * opt.values.length, 1);
  };

  const totalCombinations = getTotalCombinations();
  const newCount = preview?.filter((v) => !v.alreadyExists).length ?? 0;
  const existingCount = preview?.filter((v) => v.alreadyExists).length ?? 0;

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Option Types Builder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Option Types</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddOptionType}>
              <Plus className="mr-1 h-4 w-4" />
              Add Option Type
            </Button>
          </div>

          {optionTypes.map((option, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label>Option Type #{index + 1}</Label>
                {optionTypes.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveOptionType(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`option-name-${index}`}>Name</Label>
                  <Input
                    id={`option-name-${index}`}
                    placeholder="e.g., Size, Color, Material"
                    value={option.name}
                    onChange={(e) => handleOptionNameChange(index, e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`option-values-${index}`}>Values (comma-separated)</Label>
                  <Input
                    id={`option-values-${index}`}
                    placeholder="e.g., Small, Medium, Large"
                    value={option.values.join(", ")}
                    onChange={(e) => handleOptionValuesChange(index, e.target.value)}
                  />
                  {option.values.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {option.values.map((value, i) => (
                        <Badge key={i} variant="secondary">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {totalCombinations > 0 && (
            <div className="text-muted-foreground text-sm">
              Total combinations: <strong>{totalCombinations}</strong>
              {totalCombinations > 100 && <span className="ml-2 text-red-500">(Maximum 100 variants allowed)</span>}
            </div>
          )}
        </div>

        {/* Base Configuration */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price</Label>
            <Input
              id="basePrice"
              type="number"
              step="0.01"
              min="0"
              value={basePrice}
              onChange={(e) => {
                setBasePrice(parseFloat(e.target.value) || 0);
                setPreview(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseStock">Base Stock Quantity</Label>
            <Input
              id="baseStock"
              type="number"
              min="0"
              value={baseStock}
              onChange={(e) => {
                setBaseStock(parseInt(e.target.value) || 0);
                setPreview(null);
              }}
            />
          </div>
        </div>

        {/* SKU Pattern */}
        <div className="space-y-2">
          <Label htmlFor="skuPattern">SKU Pattern (optional)</Label>
          <Input
            id="skuPattern"
            placeholder="{BASE}-{0}-{1} or PROD-{Size}-{Color}"
            value={skuPattern}
            onChange={(e) => {
              setSkuPattern(e.target.value);
              setPreview(null);
            }}
          />
          <p className="text-muted-foreground text-xs">
            Use {"{BASE}"} for product SKU, {"{0}"}, {"{1}"} for option indexes, or {"{Size}"}, {"{Color}"} for option
            names
          </p>
        </div>

        {/* Preview Button */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={isPreviewing || totalCombinations === 0}
            className="flex-1"
          >
            {isPreviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Preview Combinations
          </Button>
        </div>

        {/* Preview Table */}
        {preview && preview.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Preview ({newCount} new, {existingCount} existing)
              </h3>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((variant, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{variant.name}</TableCell>
                      <TableCell>
                        <code className="text-xs">{variant.sku}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(variant.options).map(([name, value]) => (
                            <Badge key={name} variant="outline">
                              {name}: {value}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {variant.alreadyExists ? (
                          <Badge variant="secondary">Exists</Badge>
                        ) : (
                          <Badge className="bg-green-500">New</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {newCount === 0 && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                All combinations already exist. No new variants will be created.
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 border-t pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isGenerating}>
              Cancel
            </Button>
          )}
          <Button type="button" onClick={handleGenerate} disabled={!preview || newCount === 0 || isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate {newCount > 0 ? `${newCount} Variants` : "Variants"}
          </Button>
        </div>
      </div>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all variants?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all existing variants for this product. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
