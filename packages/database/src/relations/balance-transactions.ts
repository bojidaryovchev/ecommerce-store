import { relations } from "drizzle-orm";
import { balanceTransactions } from "../tables/balance-transactions";

export const balanceTransactionsRelations = relations(balanceTransactions, ({}) => ({}));
