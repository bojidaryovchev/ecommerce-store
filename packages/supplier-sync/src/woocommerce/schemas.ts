import { z } from "zod";

/**
 * The parts of the WooCommerce Store API (wc/store/v1) and WordPress REST API (wp/v2)
 * responses that the sync reads. Unknown fields are ignored here; the raw payload is
 * stored as-is in supplier_product.data.
 */

export const wooImageSchema = z.object({
  id: z.number(),
  src: z.string(),
  name: z.string().default(""),
  alt: z.string().default(""),
});

export const wooAttributeSchema = z.object({
  id: z.number(),
  name: z.string(),
  taxonomy: z.string().nullable().default(null),
  terms: z.array(z.object({ id: z.number(), name: z.string(), slug: z.string() })).default([]),
});

export const wooProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  type: z.string().default("simple"),
  permalink: z.string().default(""),
  sku: z.string().default(""),
  short_description: z.string().default(""),
  description: z.string().default(""),
  prices: z.object({
    price: z.string(),
    regular_price: z.string().default(""),
    sale_price: z.string().default(""),
    currency_code: z.string(),
    currency_minor_unit: z.number().int().min(0).max(4),
  }),
  images: z.array(wooImageSchema).default([]),
  categories: z.array(z.object({ id: z.number(), name: z.string() })).default([]),
  attributes: z.array(wooAttributeSchema).default([]),
  is_purchasable: z.boolean(),
  is_in_stock: z.boolean(),
  is_on_backorder: z.boolean().default(false),
});

export const wooCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  parent: z.number().default(0),
  count: z.number().default(0),
});

export const wpProductListingSchema = z.object({
  id: z.number(),
  modified_gmt: z.string(),
});

export type WooProduct = z.infer<typeof wooProductSchema>;
export type WooCategory = z.infer<typeof wooCategorySchema>;
export type WpProductListing = z.infer<typeof wpProductListingSchema>;
