/**
 * Error Handling Utilities
 *
 * Sanitizes error messages to prevent exposing sensitive information
 * to end users while maintaining detailed logging for debugging.
 */

/**
 * Sanitizes error messages for user-facing responses
 * Logs the full error for debugging while returning a safe message
 */
export function sanitizeError(error: unknown, fallbackMessage: string): string {
  // Log the full error for debugging
  console.error("Detailed error:", error);

  // Don't expose technical details to users
  if (error instanceof Error) {
    // Check for specific error types we want to expose
    if (error.message.includes("not found")) {
      return error.message;
    }
    if (error.message.includes("not available")) {
      return error.message;
    }
    if (error.message.includes("not configured")) {
      return error.message;
    }
    if (error.message.includes("Rate limit exceeded")) {
      return error.message;
    }

    // For database/technical errors, return generic message
    if (
      error.message.includes("Prisma") ||
      error.message.includes("database") ||
      error.message.includes("connection") ||
      error.message.includes("constraint")
    ) {
      return fallbackMessage;
    }
  }

  // Default to fallback message for safety
  return fallbackMessage;
}

/**
 * Common error messages for consistency
 */
export const ErrorMessages = {
  // Cart errors
  CART_ADD_FAILED: "Unable to add item to cart. Please try again.",
  CART_UPDATE_FAILED: "Unable to update cart item. Please try again.",
  CART_REMOVE_FAILED: "Unable to remove item from cart. Please try again.",
  CART_CLEAR_FAILED: "Unable to clear cart. Please try again.",
  CART_FETCH_FAILED: "Unable to load cart. Please try again.",
  CART_MERGE_FAILED: "Unable to merge carts. Please try again.",

  // Product errors
  PRODUCT_CREATE_FAILED: "Unable to create product. Please try again.",
  PRODUCT_UPDATE_FAILED: "Unable to update product. Please try again.",
  PRODUCT_DELETE_FAILED: "Unable to delete product. Please try again.",
  PRODUCT_FETCH_FAILED: "Unable to load products. Please try again.",

  // Order errors
  ORDER_FETCH_FAILED: "Unable to load orders. Please try again.",
  ORDER_UPDATE_FAILED: "Unable to update order. Please try again.",

  // Checkout errors
  CHECKOUT_FAILED: "Unable to create checkout session. Please try again.",

  // Generic errors
  GENERIC_ERROR: "Something went wrong. Please try again.",
} as const;
