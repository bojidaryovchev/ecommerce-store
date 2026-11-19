import { BackInStockEmail } from "@/emails";
import { emailCopy, emailMoney, type EmailLocale } from "@/emails/copy";
import { sendEmail } from "@/lib/email";
import { productHref } from "@/lib/routes";
import { db, schema } from "@ecommerce/database";
import { and, asc, eq, inArray, lt, or, sql } from "drizzle-orm";
import React from "react";

/** How long an unanswered request is kept: the privacy policy says six months. */
const KEEP_DAYS = 183;
/** Emails per run: a sync that brings back many products sends the rest on the next one. */
const PER_RUN = 200;

export type StockAlertRun = { sent: number; failed: number; expired: number };

/**
 * Sends the stock alerts whose product is back: one email each, then the request and its address are deleted.
 * Requests older than six months are deleted unsent. Runs after every supplier sync (lib/supplier-sync.ts), which
 * is when stock changes. A failed send keeps the request for the next run.
 */
export async function sendStockAlerts(send: typeof sendEmail = sendEmail): Promise<StockAlertRun> {
  const expiredRows = await db
    .delete(schema.stockAlerts)
    .where(lt(schema.stockAlerts.createdAt, sql`now() - make_interval(days => ${KEEP_DAYS})`))
    .returning({ id: schema.stockAlerts.id });

  const due = await db
    .select({
      id: schema.stockAlerts.id,
      email: schema.stockAlerts.email,
      locale: schema.stockAlerts.locale,
      productId: schema.products.id,
      slug: schema.products.slug,
      name: schema.products.name,
      defaultPriceId: schema.products.defaultPriceId,
    })
    .from(schema.stockAlerts)
    .innerJoin(schema.products, eq(schema.products.id, schema.stockAlerts.productId))
    .where(
      and(
        eq(schema.products.active, true),
        or(eq(schema.products.trackInventory, false), sql`coalesce(${schema.products.stockQuantity}, 0) > 0`),
      ),
    )
    .orderBy(asc(schema.stockAlerts.createdAt))
    .limit(PER_RUN);

  const productIds = [...new Set(due.map((alert) => alert.productId))];
  const prices =
    productIds.length === 0
      ? []
      : await db
          .select({
            id: schema.prices.id,
            productId: schema.prices.productId,
            unitAmount: schema.prices.unitAmount,
            currency: schema.prices.currency,
          })
          .from(schema.prices)
          .where(and(inArray(schema.prices.productId, productIds), eq(schema.prices.active, true)));

  let sent = 0;
  let failed = 0;
  for (const alert of due) {
    const locale: EmailLocale = alert.locale === "en" ? "en" : "bg";
    const own = prices.filter((price) => price.productId === alert.productId && price.unitAmount !== null);
    const price = own.find((entry) => entry.id === alert.defaultPriceId) ?? own[0];
    const delivered = await send({
      to: alert.email,
      subject: emailCopy(locale)("stockAlert.subject", { product: alert.name }),
      react: React.createElement(BackInStockEmail, {
        locale,
        productName: alert.name,
        productPath: productHref({ id: alert.productId, slug: alert.slug }),
        price: price ? emailMoney(locale, price.unitAmount!, price.currency) : null,
      }),
    });
    if (delivered) {
      await db.delete(schema.stockAlerts).where(eq(schema.stockAlerts.id, alert.id));
      sent += 1;
    } else {
      failed += 1;
    }
  }
  return { sent, failed, expired: expiredRows.length };
}
