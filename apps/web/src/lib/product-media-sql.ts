import { sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/** `primaryPhoto` (lib/product-media) in SQL, for queries that select a single image column. Server only. */
export function primaryPhotoSql(media: PgColumn, images: PgColumn): SQL<string | null> {
  return sql<string | null>`coalesce(${media}->'photos'->>0, ${images}[1])`;
}
