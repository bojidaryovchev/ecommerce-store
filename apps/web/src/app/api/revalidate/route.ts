import { revalidateCatalog } from "@/lib/supplier-sync";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

/**
 * POST /api/revalidate  { "productIds": [...] }  with `Authorization: Bearer $SUPPLIER_SYNC_SECRET`.
 * For catalog changes made outside the app (the description rewrite CLI): expires those product pages
 * and the listings so the site shows the new copy without a deploy.
 */
const bodySchema = z.object({ productIds: z.array(z.string().min(1).max(100)).max(5000) });

function authorized(request: NextRequest): boolean {
  const secret = process.env.SUPPLIER_SYNC_SECRET;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  revalidateCatalog(parsed.data.productIds);
  return NextResponse.json({ revalidated: parsed.data.productIds.length });
}
