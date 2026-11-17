import type * as schema from "@ecommerce/database/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export type Database = PostgresJsDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type DbExecutor = Database | Transaction;
