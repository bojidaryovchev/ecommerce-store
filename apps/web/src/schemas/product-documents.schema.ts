import { z } from "zod";

const link = z
  .string()
  .trim()
  .max(500, "Keep the link under 500 characters")
  .refine((value) => value === "" || /^https:\/\/\S+$/.test(value), "Use a full link starting with https://");

/**
 * The energy label and the product fiche of a product the EU labelling rules cover, as links: an EPREL page
 * (eprel.ec.europa.eu carries both), or the supplier's or manufacturer's label image and fiche. Empty clears it.
 */
export const productDocumentsSchema = z.object({
  energyLabel: link,
  productFiche: link,
});

export type ProductDocumentsInput = z.infer<typeof productDocumentsSchema>;
