import type { CartSummary } from "@/schemas/cart.schema";
import type { Prisma } from "@prisma/client";

/**
 * Cart item type with full product and variant relations
 */
export type CartItemWithRelations = Prisma.CartItemGetPayload<{
  include: {
    product: {
      include: {
        images: {
          take: 1;
          orderBy: {
            position: "asc";
          };
        };
      };
    };
    variant: true;
  };
}>;

/**
 * Calculate cart totals including subtotal, tax, shipping, and final total
 */
export function calculateCartTotals(items: CartItemWithRelations[], taxRate: number = 0): CartSummary {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const price = item.variant?.price ? Number(item.variant.price) : Number(item.product.price);
    return sum + price * item.quantity;
  }, 0);

  // Calculate tax (can be customized based on location)
  const taxAmount = subtotal * taxRate;

  // Shipping calculation (placeholder - can be enhanced with shipping rules)
  const shippingAmount = subtotal > 0 ? calculateShipping(items) : 0;

  // Discount amount (placeholder - will be enhanced with coupon system)
  const discountAmount = 0;

  // Calculate final total
  const total = subtotal + taxAmount + shippingAmount - discountAmount;

  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    shippingAmount: Number(shippingAmount.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

/**
 * Calculate shipping cost based on cart items
 * This is a simplified version - can be enhanced with weight-based or carrier API integration
 */
function calculateShipping(items: CartItemWithRelations[]): number {
  const hasPhysicalItems = items.some((item) => item.product.requiresShipping);

  if (!hasPhysicalItems) {
    return 0; // Free shipping for digital products
  }

  // Simple flat rate shipping - can be customized
  const FLAT_RATE = 10.0;
  const FREE_SHIPPING_THRESHOLD = 100.0;

  const subtotal = items.reduce((sum, item) => {
    const price = item.variant?.price ? Number(item.variant.price) : Number(item.product.price);
    return sum + price * item.quantity;
  }, 0);

  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_RATE;
}

/**
 * Format price for display with currency symbol
 */
export function formatCartPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Check if cart has expired
 * Guest carts expire after 30 days of inactivity
 */
export function isCartExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}

/**
 * Calculate new expiration date for cart
 * Default: 30 days from now
 */
export function getCartExpirationDate(days: number = 30): Date {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  return expirationDate;
}

/**
 * Check if product/variant is in stock
 */
export function isInStock(item: CartItemWithRelations): boolean {
  if (item.variant) {
    return !item.product.trackInventory || item.variant.stockQuantity >= item.quantity;
  }
  return !item.product.trackInventory || item.product.stockQuantity >= item.quantity;
}

/**
 * Get available stock for a cart item
 */
export function getAvailableStock(item: CartItemWithRelations): number {
  if (item.variant) {
    return item.variant.stockQuantity;
  }
  return item.product.stockQuantity;
}

/**
 * Check if cart item quantity exceeds available stock
 */
export function exceedsStock(item: CartItemWithRelations): boolean {
  if (!item.product.trackInventory) return false;

  const availableStock = getAvailableStock(item);
  return item.quantity > availableStock;
}

/**
 * Get maximum allowed quantity for cart item based on stock
 */
export function getMaxQuantity(item: CartItemWithRelations): number {
  if (!item.product.trackInventory) return 999;

  const availableStock = getAvailableStock(item);
  return Math.min(availableStock, 999);
}

/**
 * Validate cart item stock availability
 */
export interface StockValidationResult {
  isValid: boolean;
  message?: string;
  maxQuantity?: number;
}

export function validateCartItemStock(item: CartItemWithRelations): StockValidationResult {
  if (!item.product.isActive) {
    return {
      isValid: false,
      message: "This product is no longer available",
    };
  }

  if (item.variant && !item.variant.isActive) {
    return {
      isValid: false,
      message: "This variant is no longer available",
    };
  }

  if (!item.product.trackInventory) {
    return { isValid: true };
  }

  const availableStock = getAvailableStock(item);

  if (availableStock === 0) {
    return {
      isValid: false,
      message: "Out of stock",
    };
  }

  if (item.quantity > availableStock) {
    return {
      isValid: false,
      message: `Only ${availableStock} available`,
      maxQuantity: availableStock,
    };
  }

  return { isValid: true };
}

/**
 * Generate a unique session ID for guest carts
 */
export function generateSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
