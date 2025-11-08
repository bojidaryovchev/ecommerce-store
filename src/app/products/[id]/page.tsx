import { prismaGetProductById } from "@/actions/prisma-get-product-by-id.action";
import AddToCartFormClient from "@/components/add-to-cart-form-client.component";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeftIcon } from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

interface Props {
  params: Promise<{ id: string }>;
}

const ProductDetailPage: React.FC<Props> = async ({ params }) => {
  const { id } = await params;
  const result = await prismaGetProductById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const product = result.data;
  const defaultPrice = product.prices[0];
  const imageUrl = product.images[0];

  // Check if user is logged in
  const session = await auth();
  const userId = session?.user?.id;

  // Read existing session ID for guest users (read-only, no cookie modification)
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get("cart_session_id")?.value;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/products" className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:underline">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            {defaultPrice && (
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(defaultPrice.unitAmount, defaultPrice.currency)}
              </p>
            )}
          </div>

          {product.description && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
              <p className="mt-2 text-gray-600">{product.description}</p>
            </div>
          )}

          <AddToCartFormClient product={product} userId={userId} existingSessionId={existingSessionId} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
