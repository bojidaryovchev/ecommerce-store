import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { balanceTransactions } from "../tables/balance-transactions";

export type BalanceTransaction = InferSelectModel<typeof balanceTransactions>;
export type InsertBalanceTransaction = InferInsertModel<typeof balanceTransactions>;
