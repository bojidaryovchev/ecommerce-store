import { z } from "zod";

export const addToCartSchema = z.object({
  priceId: z.string().min(1, "Please select a price option"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export type AddToCartFormInput = z.infer<typeof addToCartSchema>;
