import { pgEnum } from "drizzle-orm/pg-core";

export const paymentLinkSubmitTypeEnum = pgEnum("payment_link_submit_type", ["auto", "book", "donate", "pay"]);
