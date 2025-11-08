import { PaymentStatus } from "@prisma/client";

/**
 * Maps Stripe payment status strings to our PaymentStatus enum
 * Handles various Stripe payment states across different objects (PaymentIntent, Charge, etc.)
 */
export function mapStripePaymentStatus(stripeStatus: string): PaymentStatus {
  switch (stripeStatus.toLowerCase()) {
    case "paid":
    case "succeeded":
      return "PAID";

    case "unpaid":
    case "pending":
      return "PENDING";

    case "failed":
      return "FAILED";

    case "refunded":
      return "REFUNDED";

    case "partially_refunded":
      return "PARTIALLY_REFUNDED";

    case "canceled":
    case "cancelled":
      return "CANCELED";

    case "requires_action":
      return "REQUIRES_ACTION";

    case "requires_confirmation":
      return "REQUIRES_CONFIRMATION";

    case "requires_payment_method":
      return "REQUIRES_PAYMENT_METHOD";

    case "processing":
    case "requires_capture":
      // These Stripe statuses don't have direct enum equivalents
      // Map to PENDING as they represent in-progress states
      return "PENDING";

    default:
      console.warn(`Unknown Stripe payment status: ${stripeStatus}, defaulting to PENDING`);
      return "PENDING";
  }
}
