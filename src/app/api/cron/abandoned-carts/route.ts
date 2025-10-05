import { DEFAULT_ABANDONMENT_CONFIG, detectAbandonedCarts, markCartAsAbandoned } from "@/lib/abandoned-cart-detector";
import {
  generateAbandonedCartEmailHTML,
  generateAbandonedCartEmailText,
  getAbandonedCartEmailSubject,
} from "@/lib/email-templates/abandoned-cart-email";
import { prisma } from "@/lib/prisma";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { NextRequest, NextResponse } from "next/server";
import { Resource } from "sst";

// Initialize SES client
const sesClient = new SESv2Client();

/**
 * Cron job to detect and send abandoned cart recovery emails
 * This should be triggered by CloudWatch Events every hour
 *
 * Security: Verifies CRON_SECRET or AWS EventBridge source
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a legitimate source
    const authHeader = request.headers.get("authorization");
    const eventSource = request.headers.get("x-amz-source");

    // Allow requests from AWS EventBridge or with valid CRON_SECRET
    const isEventBridge = eventSource === "aws:events";
    const isValidSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isEventBridge && !isValidSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Abandoned Cart Cron] Starting abandoned cart detection...");

    // Step 1: Detect abandoned carts
    const candidates = await detectAbandonedCarts(DEFAULT_ABANDONMENT_CONFIG);

    console.log(`[Abandoned Cart Cron] Found ${candidates.length} abandoned carts`);

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No abandoned carts found",
        processed: 0,
        emailsSent: 0,
        errors: 0,
      });
    }

    // Step 2: Process each abandoned cart
    const results = {
      processed: 0,
      emailsSent: 0,
      errors: 0,
      details: [] as Array<{
        cartId: string;
        email: string;
        reminderNumber: number;
        status: "sent" | "error";
        error?: string;
      }>,
    };

    for (const candidate of candidates) {
      try {
        // Mark cart as abandoned and get recovery token
        const { abandonedCartId, recoveryToken } = await markCartAsAbandoned(candidate);
        results.processed++;

        // Get the updated abandoned cart record
        const abandonedCart = await prisma.abandonedCart.findUnique({
          where: { id: abandonedCartId },
        });

        if (!abandonedCart) {
          console.error(`[Abandoned Cart Cron] Abandoned cart ${abandonedCartId} not found`);
          results.errors++;
          continue;
        }

        const reminderNumber = abandonedCart.remindersSent as 1 | 2 | 3;

        // Prepare email data
        const emailData = {
          userName: candidate.userName,
          userEmail: candidate.userEmail,
          cartItems: candidate.items.map((item) => ({
            productName: item.productName,
            variantName: item.variantName || undefined,
            quantity: item.quantity,
            price: item.price,
            imageUrl: item.productImage || undefined,
          })),
          cartTotal: candidate.cartTotal,
          recoveryLink: `${process.env.NEXT_PUBLIC_APP_URL}/cart/recover/${recoveryToken}`,
          reminderNumber,
          // Add discount for final reminder (optional - configure as needed)
          discountCode: reminderNumber === 3 ? "COMEBACK10" : undefined,
          discountAmount: reminderNumber === 3 ? 10 : undefined,
        };

        // Generate email content
        const htmlContent = generateAbandonedCartEmailHTML(emailData);
        const textContent = generateAbandonedCartEmailText(emailData);
        const subject = getAbandonedCartEmailSubject(reminderNumber, emailData.discountCode, emailData.discountAmount);

        // Send email via AWS SES
        try {
          const senderEmail = Resource.NextEmail.sender;

          const sendCommand = new SendEmailCommand({
            FromEmailAddress: `Your Store <noreply@${senderEmail}>`,
            Destination: {
              ToAddresses: [candidate.userEmail],
            },
            Content: {
              Simple: {
                Subject: {
                  Data: subject,
                  Charset: "UTF-8",
                },
                Body: {
                  Html: {
                    Data: htmlContent,
                    Charset: "UTF-8",
                  },
                  Text: {
                    Data: textContent,
                    Charset: "UTF-8",
                  },
                },
              },
            },
          });

          await sesClient.send(sendCommand);

          console.log(`[Abandoned Cart Cron] Sent reminder #${reminderNumber} to ${candidate.userEmail}`);

          results.emailsSent++;
          results.details.push({
            cartId: candidate.cartId,
            email: candidate.userEmail,
            reminderNumber,
            status: "sent",
          });
        } catch (emailError) {
          console.error(`[Abandoned Cart Cron] Failed to send email to ${candidate.userEmail}:`, emailError);
          results.errors++;
          results.details.push({
            cartId: candidate.cartId,
            email: candidate.userEmail,
            reminderNumber,
            status: "error",
            error: emailError instanceof Error ? emailError.message : "Unknown error",
          });
        }
      } catch (error) {
        console.error(`[Abandoned Cart Cron] Error processing cart ${candidate.cartId}:`, error);
        results.errors++;
      }
    }

    console.log(
      `[Abandoned Cart Cron] Completed: ${results.processed} processed, ${results.emailsSent} emails sent, ${results.errors} errors`,
    );

    return NextResponse.json({
      success: true,
      message: "Abandoned cart processing completed",
      ...results,
    });
  } catch (error) {
    console.error("[Abandoned Cart Cron] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint for manual triggering (admin only)
 * Useful for testing
 */
export async function GET(request: NextRequest) {
  // For manual testing, require CRON_SECRET
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized - Valid CRON_SECRET required" }, { status: 401 });
  }

  // Redirect to POST handler
  return POST(request);
}
