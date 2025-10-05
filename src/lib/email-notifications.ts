"use server";

import { LowStockItem } from "./stock-monitor";

/**
 * Email notification service for stock alerts
 * Sends alerts when inventory levels reach low, critical, or out-of-stock thresholds
 */

export interface EmailNotificationOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

export interface StockAlertEmailData {
  items: LowStockItem[];
  alertLevel: "low" | "critical" | "out-of-stock";
  recipientName?: string;
}

/**
 * Get email configuration from environment variables
 */
function getEmailConfig() {
  return {
    from: process.env.EMAIL_FROM || "noreply@ecommerce-store.com",
    replyTo: process.env.EMAIL_REPLY_TO,
    adminEmails: process.env.ADMIN_EMAILS?.split(",") || [],
  };
}

/**
 * Send email notification (placeholder - integrate with your email service)
 * Can be implemented with: Resend, SendGrid, AWS SES, Nodemailer, etc.
 */
async function sendEmail(options: EmailNotificationOptions): Promise<boolean> {
  const config = getEmailConfig();

  // TODO: Integrate with actual email service
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: config.from,
  //   to: options.to,
  //   subject: options.subject,
  //   html: options.html,
  // });

  console.log("📧 Email Notification:");
  console.log(`From: ${config.from}`);
  console.log(`To: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Body: ${options.text}`);

  return true;
}

/**
 * Generate HTML email template for stock alerts
 */
function generateStockAlertHtml(data: StockAlertEmailData): string {
  const { items, alertLevel, recipientName } = data;

  const alertColors = {
    low: { bg: "#FEF3C7", text: "#92400E", badge: "#FBBF24" },
    critical: { bg: "#FEE2E2", text: "#991B1B", badge: "#EF4444" },
    "out-of-stock": { bg: "#DBEAFE", text: "#1E3A8A", badge: "#3B82F6" },
  };

  const colors = alertColors[alertLevel];
  const alertTitle = {
    low: "Low Stock Alert",
    critical: "Critical Stock Alert - Immediate Action Required",
    "out-of-stock": "Out of Stock Alert",
  }[alertLevel];

  const itemsHtml = items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #E5E7EB;">
      <td style="padding: 12px; font-size: 14px; color: #374151;">
        <strong>${item.productName}</strong>
        ${item.variantId ? `<br><span style="color: #6B7280; font-size: 12px;">Variant ID: ${item.variantId}</span>` : ""}
      </td>
      <td style="padding: 12px; text-align: center;">
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: ${colors.badge}; color: white;">
          ${item.stockQuantity} units
        </span>
      </td>
      <td style="padding: 12px; text-align: center; color: #6B7280; font-size: 14px;">
        ${item.threshold} units
      </td>
    </tr>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${alertTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background-color: ${colors.bg}; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${colors.text};">
                ⚠️ ${alertTitle}
              </h1>
              ${recipientName ? `<p style="margin: 8px 0 0; font-size: 14px; color: ${colors.text};">Hello ${recipientName},</p>` : ""}
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 16px; color: #374151; line-height: 1.5;">
                ${
                  alertLevel === "critical"
                    ? "The following items have reached <strong>critical stock levels</strong> and require immediate attention:"
                    : alertLevel === "out-of-stock"
                      ? "The following items are currently <strong>out of stock</strong>:"
                      : "The following items are running <strong>low on stock</strong>:"
                }
              </p>

              <!-- Items Table -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden; margin: 24px 0;">
                <thead>
                  <tr style="background-color: #F9FAFB;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">
                      Product
                    </th>
                    <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">
                      Current Stock
                    </th>
                    <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">
                      Threshold
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Action Required -->
              <div style="margin: 24px 0; padding: 16px; background-color: ${colors.bg}; border-left: 4px solid ${colors.badge}; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: ${colors.text}; font-weight: 600;">
                  ${
                    alertLevel === "critical"
                      ? "🚨 Action Required: Please restock these items immediately to avoid stockouts."
                      : alertLevel === "out-of-stock"
                        ? "📦 Action Required: These items need to be restocked as soon as possible."
                        : "📊 Recommended Action: Consider restocking these items to maintain inventory levels."
                  }
                </p>
              </div>

              <!-- Summary -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                <tr>
                  <td style="padding: 12px; background-color: #F9FAFB; border-radius: 6px;">
                    <p style="margin: 0; font-size: 14px; color: #6B7280;">
                      <strong style="color: #111827;">Total Items Affected:</strong> ${items.length}
                    </p>
                    <p style="margin: 8px 0 0; font-size: 14px; color: #6B7280;">
                      <strong style="color: #111827;">Alert Level:</strong> ${alertLevel.toUpperCase()}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/inventory" 
                       style="display: inline-block; padding: 12px 32px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                      View Inventory Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #F9FAFB; border-radius: 0 0 8px 8px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 12px; color: #6B7280; line-height: 1.5;">
                This is an automated notification from your e-commerce inventory system.<br>
                To manage notification preferences, visit your 
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/settings/inventory" 
                   style="color: #2563EB; text-decoration: none;">
                  inventory settings
                </a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of stock alert email
 */
function generateStockAlertText(data: StockAlertEmailData): string {
  const { items, alertLevel, recipientName } = data;

  const alertTitle = {
    low: "Low Stock Alert",
    critical: "Critical Stock Alert - Immediate Action Required",
    "out-of-stock": "Out of Stock Alert",
  }[alertLevel];

  const intro = {
    critical: "The following items have reached critical stock levels and require immediate attention:",
    "out-of-stock": "The following items are currently out of stock:",
    low: "The following items are running low on stock:",
  }[alertLevel];

  const itemsList = items
    .map((item) => {
      const variant = item.variantId ? ` (Variant: ${item.variantId})` : "";
      return `  • ${item.productName}${variant}\n    Current Stock: ${item.stockQuantity} units | Threshold: ${item.threshold} units`;
    })
    .join("\n\n");

  const action = {
    critical: "🚨 Action Required: Please restock these items immediately to avoid stockouts.",
    "out-of-stock": "📦 Action Required: These items need to be restocked as soon as possible.",
    low: "📊 Recommended Action: Consider restocking these items to maintain inventory levels.",
  }[alertLevel];

  return `
${alertTitle}
${"=".repeat(alertTitle.length)}

${recipientName ? `Hello ${recipientName},\n\n` : ""}${intro}

${itemsList}

${action}

Summary:
--------
Total Items Affected: ${items.length}
Alert Level: ${alertLevel.toUpperCase()}

View your inventory dashboard at:
${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/inventory

---
This is an automated notification from your e-commerce inventory system.
To manage notification preferences, visit: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/settings/inventory
  `.trim();
}

/**
 * Send low stock alert email
 */
export async function sendLowStockAlert(
  items: LowStockItem[],
  options?: {
    recipientEmail?: string | string[];
    recipientName?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getEmailConfig();
    const recipients = options?.recipientEmail || config.adminEmails;

    if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
      return {
        success: false,
        error: "No recipient email addresses configured",
      };
    }

    const data: StockAlertEmailData = {
      items,
      alertLevel: "low",
      recipientName: options?.recipientName,
    };

    const html = generateStockAlertHtml(data);
    const text = generateStockAlertText(data);

    await sendEmail({
      to: recipients,
      subject: `⚠️ Low Stock Alert - ${items.length} Item${items.length > 1 ? "s" : ""} Need Attention`,
      html,
      text,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send low stock alert:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send critical stock alert email
 */
export async function sendCriticalStockAlert(
  items: LowStockItem[],
  options?: {
    recipientEmail?: string | string[];
    recipientName?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getEmailConfig();
    const recipients = options?.recipientEmail || config.adminEmails;

    if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
      return {
        success: false,
        error: "No recipient email addresses configured",
      };
    }

    const data: StockAlertEmailData = {
      items,
      alertLevel: "critical",
      recipientName: options?.recipientName,
    };

    const html = generateStockAlertHtml(data);
    const text = generateStockAlertText(data);

    await sendEmail({
      to: recipients,
      subject: `🚨 CRITICAL Stock Alert - ${items.length} Item${items.length > 1 ? "s" : ""} Require Immediate Action`,
      html,
      text,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send critical stock alert:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send out of stock alert email
 */
export async function sendOutOfStockAlert(
  items: LowStockItem[],
  options?: {
    recipientEmail?: string | string[];
    recipientName?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getEmailConfig();
    const recipients = options?.recipientEmail || config.adminEmails;

    if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
      return {
        success: false,
        error: "No recipient email addresses configured",
      };
    }

    const data: StockAlertEmailData = {
      items,
      alertLevel: "out-of-stock",
      recipientName: options?.recipientName,
    };

    const html = generateStockAlertHtml(data);
    const text = generateStockAlertText(data);

    await sendEmail({
      to: recipients,
      subject: `📦 Out of Stock Alert - ${items.length} Item${items.length > 1 ? "s" : ""} Unavailable`,
      html,
      text,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send out of stock alert:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send consolidated stock alert with all levels
 */
export async function sendConsolidatedStockAlert(
  lowStock: LowStockItem[],
  critical: LowStockItem[],
  outOfStock: LowStockItem[],
  options?: {
    recipientEmail?: string | string[];
    recipientName?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getEmailConfig();
    const recipients = options?.recipientEmail || config.adminEmails;

    if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
      return {
        success: false,
        error: "No recipient email addresses configured",
      };
    }

    const totalItems = lowStock.length + critical.length + outOfStock.length;
    if (totalItems === 0) {
      return { success: true }; // Nothing to send
    }

    // Send separate emails for each category
    const results = await Promise.all([
      critical.length > 0 ? sendCriticalStockAlert(critical, options) : null,
      outOfStock.length > 0 ? sendOutOfStockAlert(outOfStock, options) : null,
      lowStock.length > 0 ? sendLowStockAlert(lowStock, options) : null,
    ]);

    const failures = results.filter((r) => r && !r.success);
    if (failures.length > 0) {
      return {
        success: false,
        error: `Failed to send ${failures.length} alert(s)`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send consolidated stock alert:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Test email configuration by sending a test alert
 */
export async function sendTestStockAlert(recipientEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    const testItems: LowStockItem[] = [
      {
        type: "product",
        id: "test-1",
        productId: "test-1",
        productName: "Test Product 1",
        productSlug: "test-product-1",
        stockQuantity: 3,
        threshold: 5,
        status: "low-stock",
        lastUpdated: new Date(),
      },
      {
        type: "variant",
        id: "test-2",
        productId: "test-2",
        productName: "Test Product 2",
        productSlug: "test-product-2",
        variantId: "var-1",
        stockQuantity: 1,
        threshold: 5,
        status: "critical",
        lastUpdated: new Date(),
      },
    ];

    const html = generateStockAlertHtml({
      items: testItems,
      alertLevel: "low",
      recipientName: "Test User",
    });

    const text = generateStockAlertText({
      items: testItems,
      alertLevel: "low",
      recipientName: "Test User",
    });

    await sendEmail({
      to: recipientEmail,
      subject: "🧪 Test Stock Alert - Configuration Check",
      html,
      text,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send test stock alert:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
