/**
 * AWS Lambda handler for abandoned cart cron job
 * This function is triggered by EventBridge (CloudWatch Events) every hour
 * It calls the Next.js API endpoint to process abandoned carts
 */
export async function handler() {
  const cronUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/abandoned-carts`;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronUrl || !cronSecret) {
    console.error("Missing NEXT_PUBLIC_APP_URL or CRON_SECRET environment variables");
    throw new Error("Configuration error");
  }

  console.log(`[Abandoned Cart Cron Lambda] Triggering: ${cronUrl}`);

  try {
    const response = await fetch(cronUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`,
        "x-amz-source": "aws:events",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Abandoned Cart Cron Lambda] Error response:", data);
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    console.log("[Abandoned Cart Cron Lambda] Success:", data);

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("[Abandoned Cart Cron Lambda] Failed to trigger cron:", error);
    throw error;
  }
}
