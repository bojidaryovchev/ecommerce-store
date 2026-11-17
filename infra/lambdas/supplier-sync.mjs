/**
 * Supplier Sync Lambda
 *
 * Triggered by EventBridge: { "mode": "incremental" } every 4 hours and { "mode": "full" } nightly.
 * Calls the Next.js API, which imports new and changed supplier products, prices and stock.
 * A failed sync makes this invocation fail, so it shows up in the Lambda's error metrics.
 */
export const handler = async (event) => {
  const mode = event?.mode === "full" ? "full" : "incremental";
  const url = `${process.env.APP_URL}/api/supplier-sync`;
  console.log(`Starting ${mode} supplier sync via ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPPLIER_SYNC_SECRET}`,
    },
    body: JSON.stringify({ mode }),
    signal: AbortSignal.timeout(295_000),
  });

  const data = await response.json().catch(() => ({}));
  console.log("Supplier sync response:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(
      `Supplier sync failed (HTTP ${response.status}): ${data.message ?? data.error ?? response.statusText}`,
    );
  }
  return data;
};
