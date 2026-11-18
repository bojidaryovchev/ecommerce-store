import { z } from "zod";

/**
 * A delivery or billing address, checked by React Hook Form in the browser and again in the actions. Each
 * message is a key under `account.addressForm.errors`.
 */
export const addressSchema = z
  .object({
    name: z.string().trim().min(1, "name").max(120, "name"),
    line1: z.string().trim().min(1, "line1").max(200, "line1"),
    line2: z.string().trim().max(200, "line2"),
    city: z.string().trim().min(1, "city").max(100, "city"),
    state: z.string().trim().max(100, "state"),
    postalCode: z.string().trim().min(1, "postalCode").max(20, "postalCode"),
    country: z.string().trim().length(2, "country"),
    phone: z
      .string()
      .trim()
      .max(40, "phone")
      .regex(/^[+\d\s()/-]*$/, "phone"),
    type: z.enum(["shipping", "billing"]),
    isDefault: z.boolean(),
  })
  .superRefine((address, context) => {
    // Bulgarian postcodes are four digits.
    if (address.country === "BG" && !/^\d{4}$/.test(address.postalCode)) {
      context.addIssue({ code: "custom", path: ["postalCode"], message: "postalCode" });
    }
  });

export type AddressInput = z.input<typeof addressSchema>;
