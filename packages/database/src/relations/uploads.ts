import { relations } from "drizzle-orm";
import { uploads } from "../tables/uploads";

export const uploadsRelations = relations(uploads, () => ({
  // Uploads are intentionally not linked via foreign keys to entities
  // because they can be linked to multiple entity types (categories, products, etc.)
  // The linkedEntityId + linkedEntityType pattern allows flexible linking
}));
