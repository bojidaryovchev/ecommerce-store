import { sql, type SQL } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { productTypeEnum } from "../enums";
import { categories } from "./categories";

export type ProductMedia = {
  photos: string[];
  chips: Array<{ url: string; kind: "icon" | "badge" | "energy_label"; label: string | null }>;
  drawings: string[];
};

export const products = pgTable(
  "product",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    stripeProductId: text("stripe_product_id").unique(),
    object: text("object").default("product"),
    name: text("name").notNull(),
    /** URL slug for /produkt/{slug}: transliterated from the name once, then stable. */
    slug: text("slug").unique(),
    description: text("description"),
    active: boolean("active").default(true).notNull(),
    images: text("images").array().notNull().default([]),
    /**
     * What the images are, derived from their classification (image_asset and the enrichment's classify stage;
     * see refreshProductMedia in @ecommerce/supplier-sync): the photos a gallery shows, the icons and badges shown
     * as small labelled chips, and drawings and spec tables. Null until derived: show `images` as they are.
     */
    media: jsonb("media").$type<ProductMedia>(),
    metadata: jsonb("metadata").$type<Record<string, string>>().notNull().default({}),
    defaultPriceId: text("default_price_id"),
    shippable: boolean("shippable").default(true),
    taxCode: text("tax_code"),
    unitLabel: text("unit_label"),
    url: text("url"),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    brand: text("brand"),
    /**
     * Fields we edited by hand on a supplier-synced product; the sync leaves these alone.
     * Values: see LOCKABLE_PRODUCT_FIELDS in @ecommerce/supplier-sync.
     */
    lockedFields: text("locked_fields").array().notNull().default([]),
    statementDescriptor: text("statement_descriptor"),
    livemode: boolean("livemode").default(false).notNull(),
    trackInventory: boolean("track_inventory").default(false).notNull(),
    stockQuantity: integer("stock_quantity"),
    marketingFeatures: jsonb("marketing_features")
      .$type<
        Array<{
          name?: string;
        }>
      >()
      .notNull()
      .default([]),
    packageDimensions: jsonb("package_dimensions").$type<{
      height?: number;
      length?: number;
      weight?: number;
      width?: number;
    }>(),
    taxDetails: jsonb("tax_details").$type<Record<string, unknown>>(),
    type: productTypeEnum("type").default("service").notNull(),
    updated: timestamp("updated", { mode: "date" }).defaultNow().notNull(),
    created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
    /**
     * Name and brand in lowercase, in the original script and transliterated to Latin
     * (bg_translit, migration 0009), so "kamina artel" finds "Камина Артел". Trigram-indexed.
     */
    searchText: text("search_text").generatedAlwaysAs(
      (): SQL =>
        sql`lower(${products.name} || ' ' || coalesce(${products.brand}, '')) || ' ' || bg_translit(${products.name} || ' ' || coalesce(${products.brand}, ''))`,
    ),
  },
  (table) => [index("product_search_text_trgm_idx").using("gin", table.searchText.op("gin_trgm_ops"))],
);
