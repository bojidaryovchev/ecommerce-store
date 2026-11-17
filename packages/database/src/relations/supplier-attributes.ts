import { relations } from "drizzle-orm";
import { attributes } from "../tables/attributes";
import { supplierAttributes } from "../tables/supplier-attributes";
import { suppliers } from "../tables/suppliers";

export const supplierAttributesRelations = relations(supplierAttributes, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierAttributes.supplierId],
    references: [suppliers.id],
  }),
  attribute: one(attributes, {
    fields: [supplierAttributes.attributeId],
    references: [attributes.id],
  }),
}));
