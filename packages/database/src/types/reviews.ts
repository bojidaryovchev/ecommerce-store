import { reviews } from "../tables/reviews";

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
