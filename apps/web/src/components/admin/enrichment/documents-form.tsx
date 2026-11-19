"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProductDocumentsAction } from "@/mutations/enrichment";
import { productDocumentsSchema, type ProductDocumentsInput } from "@/schemas/product-documents.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { ReviewData } from "./review-data";

/**
 * The energy label and product fiche links (the EU internet display rules want both next to the price). The
 * product's page on EPREL carries both, so its link in the fiche box is enough.
 */
const DocumentsForm: React.FC<{ productId: string; documents: NonNullable<ReviewData["documents"]> }> = ({
  productId,
  documents,
}) => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductDocumentsInput>({
    resolver: zodResolver(productDocumentsSchema),
    defaultValues: { energyLabel: documents.energyLabel, productFiche: documents.productFiche },
  });

  const onSubmit = async (input: ProductDocumentsInput) => {
    const result = await saveProductDocumentsAction(productId, input);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Saved. The class arrow next to the price opens the label.");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="product-fiche">Product fiche (an EPREL link is best)</Label>
          <Input
            id="product-fiche"
            type="url"
            placeholder="https://eprel.ec.europa.eu/screen/product/…"
            {...register("productFiche")}
            aria-invalid={Boolean(errors.productFiche)}
            disabled={isSubmitting}
          />
          {errors.productFiche?.message && <p className="text-destructive text-xs">{errors.productFiche.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="energy-label">Energy label (image or PDF)</Label>
          <Input
            id="energy-label"
            type="url"
            placeholder={documents.labelImage ? "Found among the supplier's pictures" : "https://…"}
            {...register("energyLabel")}
            aria-invalid={Boolean(errors.energyLabel)}
            disabled={isSubmitting}
          />
          {errors.energyLabel?.message && <p className="text-destructive text-xs">{errors.energyLabel.message}</p>}
          {documents.labelImage && (
            <p className="text-muted-foreground text-xs">
              The supplier&apos;s pictures include a label, which the arrow opens unless a link is given here.
            </p>
          )}
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Saving…" : "Save the links"}
      </Button>
    </form>
  );
};

export { DocumentsForm };
