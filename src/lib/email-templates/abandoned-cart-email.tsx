import { formatCurrency } from "@/lib/analytics-utils";

export interface CartItem {
  productName: string;
  variantName?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface AbandonedCartEmailData {
  userName: string | null;
  userEmail: string;
  cartItems: CartItem[];
  cartTotal: number;
  recoveryLink: string;
  reminderNumber: 1 | 2 | 3;
  discountCode?: string;
  discountAmount?: number;
}

/**
 * Generate HTML email for abandoned cart recovery
 */
export function generateAbandonedCartEmailHTML(data: AbandonedCartEmailData): string {
  const { userName, cartItems, cartTotal, recoveryLink, reminderNumber, discountCode, discountAmount } = data;

  const greeting = userName ? `Hi ${userName}` : "Hi there";

  // Email content varies by reminder number
  const content = getEmailContent(reminderNumber, discountCode, discountAmount);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #000000;
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .cart-items {
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      margin-bottom: 30px;
      overflow: hidden;
    }
    .cart-item {
      display: flex;
      padding: 20px;
      border-bottom: 1px solid #e5e5e5;
      align-items: center;
    }
    .cart-item:last-child {
      border-bottom: none;
    }
    .item-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 6px;
      margin-right: 20px;
      background-color: #f4f4f4;
    }
    .item-details {
      flex: 1;
    }
    .item-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 5px;
      color: #111827;
    }
    .item-variant {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .item-quantity {
      font-size: 14px;
      color: #6b7280;
    }
    .item-price {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      text-align: right;
    }
    .cart-total {
      background-color: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      font-weight: 700;
      color: #111827;
    }
    .discount-badge {
      background-color: #10b981;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 30px;
      font-weight: 600;
    }
    .discount-code {
      font-size: 24px;
      letter-spacing: 2px;
      margin-top: 8px;
      font-family: 'Courier New', monospace;
    }
    .cta-button {
      display: inline-block;
      background-color: #000000;
      color: #ffffff !important;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      margin-bottom: 20px;
    }
    .cta-button:hover {
      background-color: #1f2937;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    .link-text {
      font-size: 14px;
      color: #6b7280;
      text-align: center;
      margin-top: 15px;
      word-break: break-all;
    }
    .urgency {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px 20px;
      margin-bottom: 30px;
      border-radius: 4px;
    }
    .urgency-text {
      margin: 0;
      font-size: 14px;
      color: #92400e;
    }
    .social-proof {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #10b981;
    }
    .social-proof p {
      margin: 0;
      font-size: 14px;
      color: #065f46;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e5e5;
    }
    .footer-text {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 15px;
    }
    .unsubscribe {
      font-size: 12px;
      color: #9ca3af;
    }
    .unsubscribe a {
      color: #6b7280;
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .cart-item {
        flex-direction: column;
        text-align: center;
      }
      .item-image {
        margin-right: 0;
        margin-bottom: 15px;
      }
      .item-price {
        text-align: center;
        margin-top: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🛒 Your Shopping Cart</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">${greeting},</div>
      
      <div class="message">
        ${content.message}
      </div>

      ${
        content.urgency
          ? `
      <div class="urgency">
        <p class="urgency-text">${content.urgency}</p>
      </div>
      `
          : ""
      }

      ${
        content.socialProof
          ? `
      <div class="social-proof">
        <p>${content.socialProof}</p>
      </div>
      `
          : ""
      }

      ${
        discountCode
          ? `
      <div class="discount-badge">
        <div>💰 Special Offer Just for You!</div>
        <div>Save ${discountAmount}% with code:</div>
        <div class="discount-code">${discountCode}</div>
      </div>
      `
          : ""
      }

      <!-- Cart Items -->
      <div class="cart-items">
        ${cartItems
          .map(
            (item) => `
          <div class="cart-item">
            ${
              item.imageUrl
                ? `
              <img src="${item.imageUrl}" alt="${item.productName}" class="item-image" />
            `
                : `
              <div class="item-image"></div>
            `
            }
            <div class="item-details">
              <div class="item-name">${item.productName}</div>
              ${item.variantName ? `<div class="item-variant">${item.variantName}</div>` : ""}
              <div class="item-quantity">Quantity: ${item.quantity}</div>
            </div>
            <div class="item-price">${formatCurrency(item.price * item.quantity)}</div>
          </div>
        `,
          )
          .join("")}
      </div>

      <!-- Total -->
      <div class="cart-total">
        <div class="total-row">
          <span>Total:</span>
          <span>${formatCurrency(cartTotal)}</span>
        </div>
      </div>

      <!-- CTA -->
      <div class="cta-container">
        <a href="${recoveryLink}" class="cta-button">
          ${content.ctaText}
        </a>
        <div class="link-text">
          Or copy this link: ${recoveryLink}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">
        Questions? Contact us at support@yourstore.com
      </div>
      <div class="footer-text">
        This is an automated reminder about your shopping cart.
      </div>
      <div class="unsubscribe">
        <a href="#">Unsubscribe from cart reminders</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for abandoned cart recovery
 */
export function generateAbandonedCartEmailText(data: AbandonedCartEmailData): string {
  const { userName, cartItems, cartTotal, recoveryLink, reminderNumber, discountCode, discountAmount } = data;

  const greeting = userName ? `Hi ${userName}` : "Hi there";
  const content = getEmailContent(reminderNumber, discountCode, discountAmount);

  let text = `${greeting},\n\n`;
  text += `${content.message}\n\n`;

  if (content.urgency) {
    text += `⚠️ ${content.urgency}\n\n`;
  }

  if (content.socialProof) {
    text += `✨ ${content.socialProof}\n\n`;
  }

  if (discountCode) {
    text += `💰 SPECIAL OFFER JUST FOR YOU!\n`;
    text += `Save ${discountAmount}% with code: ${discountCode}\n\n`;
  }

  text += `YOUR CART ITEMS:\n`;
  text += `${"=".repeat(50)}\n\n`;

  cartItems.forEach((item) => {
    text += `${item.productName}\n`;
    if (item.variantName) {
      text += `  ${item.variantName}\n`;
    }
    text += `  Quantity: ${item.quantity}\n`;
    text += `  Price: ${formatCurrency(item.price * item.quantity)}\n\n`;
  });

  text += `${"=".repeat(50)}\n`;
  text += `TOTAL: ${formatCurrency(cartTotal)}\n\n`;

  text += `${content.ctaText.toUpperCase()}:\n`;
  text += `${recoveryLink}\n\n`;

  text += `Questions? Contact us at support@yourstore.com\n\n`;
  text += `This is an automated reminder about your shopping cart.\n`;
  text += `To unsubscribe from cart reminders, visit: [unsubscribe link]\n`;

  return text;
}

/**
 * Get email content based on reminder number
 */
function getEmailContent(
  reminderNumber: 1 | 2 | 3,
  discountCode?: string,
  discountAmount?: number,
): {
  subject: string;
  message: string;
  urgency?: string;
  socialProof?: string;
  ctaText: string;
} {
  switch (reminderNumber) {
    case 1:
      // First reminder (1 hour) - Gentle reminder
      return {
        subject: "You left something in your cart",
        message:
          "We noticed you left some items in your shopping cart. We've saved them for you in case you'd like to complete your purchase.",
        ctaText: "Complete My Purchase",
      };

    case 2:
      // Second reminder (24 hours) - Urgency + social proof
      return {
        subject: "Still interested? Your cart is waiting",
        message: "Your cart is still waiting for you! These items are popular and may sell out soon.",
        urgency: "⏰ Items in your cart are selling fast! Complete your order before they're gone.",
        socialProof:
          "⭐ Join thousands of happy customers who shop with us every day. Don't miss out on these great products!",
        ctaText: "Checkout Now",
      };

    case 3:
      // Final reminder (72 hours) - Last chance + discount
      return {
        subject: discountCode
          ? `Last chance + ${discountAmount}% OFF just for you!`
          : "Last reminder: Your cart expires soon",
        message: discountCode
          ? `This is your last chance! As a thank you for being a valued customer, we're offering you an exclusive ${discountAmount}% discount on your cart.`
          : "This is your last chance! Your cart will expire soon, and we'd hate for you to miss out on these items.",
        urgency: "🔥 This is your final reminder. Your cart and special offer will expire in 24 hours!",
        ctaText: discountCode ? "Claim My Discount" : "Complete Order Now",
      };
  }
}

/**
 * Get email subject line
 */
export function getAbandonedCartEmailSubject(
  reminderNumber: 1 | 2 | 3,
  discountCode?: string,
  discountAmount?: number,
): string {
  return getEmailContent(reminderNumber, discountCode, discountAmount).subject;
}
