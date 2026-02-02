import { refunds } from "../tables/refunds";

export type Refund = typeof refunds.$inferSelect;
export type NewRefund = typeof refunds.$inferInsert;
