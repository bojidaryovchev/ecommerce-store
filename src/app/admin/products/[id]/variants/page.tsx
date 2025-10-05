import { getVariants } from "@/actions/get-variants.action";
import { BulkVariantGenerator } from "@/components/admin/bulk-variant-generator";
import { ProductVariantForm } from "@/components/admin/product-variant-form";
import { ProductVariantList } from "@/components/admin/product-variant-list";
import { QuickEditButton } from "@/components/admin/quick-edit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";
import type { ProductVariant } from "@prisma/client";
import { Package, Plus } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { name: true },
  });

  return {
    title: product ? `${product.name} - Variants | Admin` : "Product Variants | Admin",
    description: "Manage product variants",
  };
}

export default async function ProductVariantsPage({ params }: PageProps) {
  // Fetch product details
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Fetch variants
  const result = await getVariants({
    productId: params.id,
    includeInactive: true,
  });

  const variants = result.success && result.variants ? result.variants : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin/products">
              <Button variant="ghost" size="sm">
                ← Back to Products
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">
            Manage product variants • {variants.length} {variants.length === 1 ? "variant" : "variants"}
          </p>
        </div>
      </div>

      {/* Variants Management */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">
            <Package className="mr-2 h-4 w-4" />
            Variants ({variants.length})
          </TabsTrigger>
          <TabsTrigger value="bulk">
            <Plus className="mr-2 h-4 w-4" />
            Bulk Generate
          </TabsTrigger>
        </TabsList>

        {/* Variants List Tab */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Variants</CardTitle>
                  <CardDescription>
                    Manage individual variants with different options, prices, and stock levels
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {variants.length > 0 && <QuickEditButton productId={params.id} variants={variants} />}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Variant
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Add New Variant</DialogTitle>
                        <DialogDescription>
                          Create a new variant with custom options, price, and stock
                        </DialogDescription>
                      </DialogHeader>
                      <ProductVariantFormWrapper productId={params.id} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {variants.length > 0 ? (
                <ProductVariantListWrapper productId={params.id} variants={variants} />
              ) : (
                <div className="py-12 text-center">
                  <Package className="text-muted-foreground mx-auto h-12 w-12" />
                  <h3 className="mt-4 text-lg font-semibold">No variants yet</h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Create variants to offer different options like sizes or colors
                  </p>
                  <div className="mt-6 flex justify-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Variant
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Add New Variant</DialogTitle>
                          <DialogDescription>
                            Create a new variant with custom options, price, and stock
                          </DialogDescription>
                        </DialogHeader>
                        <ProductVariantFormWrapper productId={params.id} />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const bulkTab = document.querySelector('[value="bulk"]') as HTMLElement;
                        bulkTab?.click();
                      }}
                    >
                      Or Bulk Generate
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Generate Tab */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Variant Generator</CardTitle>
              <CardDescription>Generate multiple variants automatically from option combinations</CardDescription>
            </CardHeader>
            <CardContent>
              <BulkVariantGeneratorWrapper productId={params.id} productSku={product.sku || undefined} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Client component wrappers
function ProductVariantFormWrapper({ productId }: { productId: string }) {
  return (
    <ProductVariantForm
      productId={productId}
      onSuccess={() => {
        // Close dialog and refresh
        const closeButton = document.querySelector("[data-dialog-close]") as HTMLElement;
        closeButton?.click();
        window.location.reload();
      }}
    />
  );
}

function ProductVariantListWrapper({ productId, variants }: { productId: string; variants: ProductVariant[] }) {
  return (
    <ProductVariantList
      productId={productId}
      variants={variants}
      onDelete={() => {
        window.location.reload();
      }}
    />
  );
}

function BulkVariantGeneratorWrapper({ productId, productSku }: { productId: string; productSku?: string }) {
  return (
    <BulkVariantGenerator
      productId={productId}
      productSku={productSku}
      onSuccess={() => {
        window.location.reload();
      }}
    />
  );
}
