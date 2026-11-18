import { imageAssets } from "../tables/image-assets";

export type ImageAsset = typeof imageAssets.$inferSelect;
export type NewImageAsset = typeof imageAssets.$inferInsert;
