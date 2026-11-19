import { relations } from "drizzle-orm";
import { categories } from "../tables/categories";
import { categoryFaqs } from "../tables/category-faqs";
import { products } from "../tables/products";

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parentChild",
  }),
  children: many(categories, { relationName: "parentChild" }),
  products: many(products),
  faq: one(categoryFaqs, { fields: [categories.id], references: [categoryFaqs.categoryId] }),
}));
