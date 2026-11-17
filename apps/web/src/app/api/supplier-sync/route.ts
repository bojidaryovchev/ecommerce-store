import { syncSupplierCatalog } from "@/lib/supplier-sync";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

// A full sync of ~400 products takes about a minute against a remote database.
export const maxDuration = 300;

const bodySchema = z.object({
  mode: z.enum(["incremental", "full"]).default("incremental"),
  supplier: z.string().optional(),
});

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.SUPPLIER_SYNC_SECRET;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/supplier-sync  { "mode": "incremental" | "full" }
 * Called on a schedule by the supplier-sync Lambda (see infra/index.ts): incremental every
 * 4 hours, full nightly. Authenticated with `Authorization: Bearer $SUPPLIER_SYNC_SECRET`.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }

  try {
    const result = await syncSupplierCatalog({
      mode: parsed.data.mode,
      supplier: parsed.data.supplier,
      trigger: "schedule",
    });
    return NextResponse.json(
      {
        runId: result.runId,
        status: result.status,
        message: result.message,
        stats: result.stats,
        errors: result.errors.slice(0, 20),
      },
      { status: result.status === "failed" ? 502 : 200 },
    );
  } catch (error) {
    console.error("Supplier sync failed to start:", error);
    return NextResponse.json({ error: "Supplier sync failed to start" }, { status: 500 });
  }
}
