"use client";

import { VariantQuickEditModal } from "@/components/admin/variant-quick-edit-modal";
import { Button } from "@/components/ui/button";
import type { ProductVariant } from "@prisma/client";
import { useState } from "react";

interface QuickEditButtonProps {
  productId: string;
  variants: ProductVariant[];
}

export function QuickEditButton({ productId, variants }: QuickEditButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Quick Edit
      </Button>
      <VariantQuickEditModal
        productId={productId}
        variants={variants}
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}
