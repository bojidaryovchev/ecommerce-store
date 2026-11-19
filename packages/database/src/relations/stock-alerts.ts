import { relations } from "drizzle-orm";
import { products } from "../tables/products";
import { stockAlerts } from "../tables/stock-alerts";

export const stockAlertsRelations = relations(stockAlerts, ({ one }) => ({
  product: one(products, {
    fields: [stockAlerts.productId],
    references: [products.id],
  }),
}));
