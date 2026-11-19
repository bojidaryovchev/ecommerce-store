import { z } from "zod";

/**
 * Asking to be emailed once when a product is back in stock, checked the same way in the browser (React Hook Form)
 * and in the action. Each message is the key of its text under `products.detail.stockAlert.errors`.
 */
export const stockAlertSchema = z.object({
  email: z.string().trim().toLowerCase().max(254, "email").pipe(z.email("email")),
  consent: z.boolean().refine((given) => given, { message: "consent" }),
});

export type StockAlertInput = z.input<typeof stockAlertSchema>;
export type StockAlertField = "email" | "consent";
