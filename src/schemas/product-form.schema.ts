import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  images: z.string().optional(),
  unitAmount: z.number().min(0, "Unit amount must be positive"),
  currency: z.string(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
