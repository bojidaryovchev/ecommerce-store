import { pgEnum } from "drizzle-orm/pg-core";

export const chargeStatusEnum = pgEnum("charge_status", ["succeeded", "pending", "failed"]);
