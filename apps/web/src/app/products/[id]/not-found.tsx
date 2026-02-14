import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const ProductNotFound: React.FC = () => {
  return (
    <main className="max-w-container py-16">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    </main>
  );
};

export default ProductNotFound;
