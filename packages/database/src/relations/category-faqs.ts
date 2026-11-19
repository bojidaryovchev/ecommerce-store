import { relations } from "drizzle-orm";
import { categories } from "../tables/categories";
import { categoryFaqs } from "../tables/category-faqs";

export const categoryFaqsRelations = relations(categoryFaqs, ({ one }) => ({
  category: one(categories, {
    fields: [categoryFaqs.categoryId],
    references: [categories.id],
  }),
}));
