"use server";

import { routing } from "@/i18n/routing";
import { stockAlertSchema, type StockAlertField, type StockAlertInput } from "@/schemas/stock-alert.schema";
import { db, schema } from "@ecommerce/database";
import { and, count, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";

export type StockAlertState = {
  ok?: boolean;
  /** Per field, the key of the message under `products.detail.stockAlert.errors`. */
  errors?: Partial<Record<StockAlertField, StockAlertField>>;
  /** A message for the whole form, already in the visitor's language. */
  error?: string;
};

export type StockAlertSubmission = StockAlertInput & {
  productId: string;
  locale: string;
  /** When the form was shown: a person needs longer to fill it than a script. */
  startedAt: number;
  /** The field only bots fill. */
  website?: string;
};

/** A person needs longer than this to type an address and tick the box; a script does not. */
const MIN_FILL_MS = 1500;
/** Open requests one address may have: enough for a person, too few to bury someone in emails. */
const MAX_PER_EMAIL = 20;

const outOfStock = (product: { trackInventory: boolean; stockQuantity: number | null }) =>
  product.trackInventory && (product.stockQuantity ?? 0) <= 0;

/**
 * Records a visitor's request to be emailed once when an out-of-stock product is back (lib/stock-alerts.ts sends
 * it after a supplier sync). Public, so the form's schema is checked again here, with a field only bots fill and
 * a minimum time on the form; neither is announced to whoever trips it. Asking twice is the same request.
 */
async function requestStockAlertAction(submission: StockAlertSubmission): Promise<StockAlertState> {
  const locale = routing.locales.includes(submission.locale as never) ? submission.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "products.detail.stockAlert" });

  if (submission.website) return { ok: true };
  const startedAt = Number(submission.startedAt);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) return { error: t("errors.tooFast") };

  const parsed = stockAlertSchema.safeParse(submission);
  if (!parsed.success) {
    const errors: StockAlertState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (field === "email" || field === "consent") errors[field] = field;
    }
    return { errors };
  }
  const { email } = parsed.data;

  try {
    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, String(submission.productId)),
      columns: { id: true, active: true, trackInventory: true, stockQuantity: true },
    });
    if (!product || !product.active) return { error: t("errors.unavailable") };
    if (!outOfStock(product)) return { error: t("errors.inStock") };

    const [open] = await db
      .select({ value: count() })
      .from(schema.stockAlerts)
      .where(eq(schema.stockAlerts.email, email));
    if ((open?.value ?? 0) >= MAX_PER_EMAIL) return { error: t("errors.tooMany") };

    await db
      .insert(schema.stockAlerts)
      .values({ productId: product.id, email, locale: locale === "en" ? "en" : "bg" })
      .onConflictDoNothing();
    return { ok: true };
  } catch (error) {
    console.error("Could not record a stock alert", error);
    return { error: t("errors.failed") };
  }
}

/** Withdraws the request: the address is deleted with it. Withdrawing one that is not there is not an error. */
async function cancelStockAlertAction(input: {
  productId: string;
  email: string;
  locale: string;
}): Promise<StockAlertState> {
  const locale = routing.locales.includes(input.locale as never) ? input.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "products.detail.stockAlert" });
  const email = String(input.email).trim().toLowerCase();
  try {
    await db
      .delete(schema.stockAlerts)
      .where(and(eq(schema.stockAlerts.productId, String(input.productId)), eq(schema.stockAlerts.email, email)));
    return { ok: true };
  } catch (error) {
    console.error("Could not withdraw a stock alert", error);
    return { error: t("errors.failed") };
  }
}

export { cancelStockAlertAction, requestStockAlertAction };
