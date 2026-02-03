import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { uploadStatusEnum } from "../enums/upload-status";

export const uploads = pgTable("upload", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** S3 object key (e.g., "categories/1234-abc-image.png") */
  key: text("key").notNull().unique(),
  /** Full public URL to the uploaded file */
  publicUrl: text("public_url").notNull(),
  /** Original filename uploaded by user */
  filename: text("filename").notNull(),
  /** MIME type of the uploaded file */
  contentType: text("content_type").notNull(),
  /** File size in bytes */
  size: integer("size"),
  /** Folder/category for the upload (e.g., "categories", "products") */
  folder: text("folder").notNull(),
  /** Upload status: pending (not yet linked), linked (in use), deleted (marked for cleanup) */
  status: uploadStatusEnum("status").default("pending").notNull(),
  /** Reference to the entity using this upload (e.g., category ID, product ID) */
  linkedEntityId: text("linked_entity_id"),
  /** Type of entity this upload is linked to (e.g., "category", "product") */
  linkedEntityType: text("linked_entity_type"),
  /** When the upload was created */
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  /** When the upload was last updated */
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  /** When the upload was linked to an entity */
  linkedAt: timestamp("linked_at", { mode: "date" }),
  /** When the upload was marked for deletion */
  deletedAt: timestamp("deleted_at", { mode: "date" }),
});
