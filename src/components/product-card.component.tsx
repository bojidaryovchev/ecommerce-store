"use client";

import { formatCurrency } from "@/lib/utils";
import type { Price, Product } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  product: Product & { prices: Price[] };
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const defaultPrice = product.prices[0];
  const imageUrl = product.images[0];

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        {product.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{product.description}</p>}
        {defaultPrice && (
          <p className="mt-2 text-lg font-bold text-gray-900">
            {formatCurrency(defaultPrice.unitAmount, defaultPrice.currency)}
          </p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
