/**
 * Upload Cleanup Lambda
 *
 * This Lambda function is triggered by EventBridge on a schedule to clean up
 * orphaned uploads (images uploaded but never linked to a category or product).
 *
 * It calls the Next.js API endpoint which handles the actual cleanup logic.
 */
export const handler = async (event) => {
  const appUrl = process.env.APP_URL;
  const cleanupSecret = process.env.CLEANUP_SECRET;

  console.log("Starting upload cleanup...");
  console.log("App URL:", appUrl);
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    const response = await fetch(`${appUrl}/api/upload/cleanup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cleanupSecret}`,
      },
      body: JSON.stringify({
        thresholdHours: 24,
        batchSize: 100,
      }),
    });

    const data = await response.json();
    console.log("Cleanup response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(`Cleanup failed: ${data.error || response.statusText}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Cleanup error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
