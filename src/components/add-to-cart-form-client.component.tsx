"use client";

import { getOrCreateSession } from "@/actions/get-or-create-session.action";
import { prismaAddToCart } from "@/actions/prisma-add-to-cart.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { addToCartSchema, type AddToCartFormInput } from "@/schemas/add-to-cart.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Price, Product } from "@prisma/client";
import { LoaderIcon, ShoppingCartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";

interface Props {
  product: Product & { prices: Price[] };
  userId?: string;
  existingSessionId?: string;
}

const AddToCartFormClient: React.FC<Props> = ({ product, userId, existingSessionId }) => {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId || null);
  const sessionInitialized = useRef(false);

  // Initialize or get session on client side (only for guest users)
  useEffect(() => {
    // If user is logged in, we don't need a session
    if (userId) return;

    if (sessionInitialized.current) return;
    sessionInitialized.current = true;

    const initSession = async () => {
      const id = await getOrCreateSession();
      setSessionId(id);
    };

    // Always call to ensure cookie is set
    initSession();
  }, [userId, existingSessionId]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AddToCartFormInput>({
    resolver: zodResolver(addToCartSchema),
    defaultValues: {
      priceId: product.prices[0]?.id || "",
      quantity: 1,
    },
  });

  const selectedPriceId = useWatch({ control, name: "priceId" });

  const onSubmit = async (data: AddToCartFormInput) => {
    // Check requirements based on user status
    if (!userId && !sessionId) {
      toast.error("Session not initialized. Please try again.");
      return;
    }

    try {
      const result = await prismaAddToCart({
        productId: product.id,
        priceId: data.priceId,
        quantity: data.quantity,
        userId,
        sessionId: userId ? undefined : sessionId || undefined,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to add to cart");
      } else {
        toast.success("Added to cart!");
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add to cart");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {product.prices.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor="price">Select Option</Label>
          <Select value={selectedPriceId} onValueChange={(value) => setValue("priceId", value)}>
            <SelectTrigger id="price">
              <SelectValue placeholder="Select a price option" />
            </SelectTrigger>
            <SelectContent>
              {product.prices.map((price) => (
                <SelectItem key={price.id} value={price.id}>
                  {formatCurrency(price.unitAmount, price.currency)}
                  {price.type === "RECURRING" &&
                    ` / ${price.interval}${price.intervalCount && price.intervalCount > 1 ? ` (every ${price.intervalCount})` : ""}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.priceId && <p className="text-sm text-red-600">{errors.priceId.message}</p>}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input id="quantity" type="number" min="1" {...register("quantity", { valueAsNumber: true })} />
        {errors.quantity && <p className="text-sm text-red-600">{errors.quantity.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <ShoppingCartIcon className="mr-2 h-4 w-4" />
            Add to Cart
          </>
        )}
      </Button>
    </form>
  );
};

export default AddToCartFormClient;
