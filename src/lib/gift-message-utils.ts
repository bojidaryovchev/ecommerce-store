/**
 * Gift Message Moderation Utility
 * Provides content filtering and validation for gift messages
 */

/**
 * List of inappropriate words/phrases to filter
 * This is a basic implementation - can be enhanced with more sophisticated filtering
 */
const INAPPROPRIATE_WORDS: string[] = [
  // Add words to filter here
  // This list should be customized based on your requirements
];

/**
 * Check if message contains inappropriate content
 */
export function containsInappropriateContent(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  return INAPPROPRIATE_WORDS.some((word) => lowerMessage.includes(word.toLowerCase()));
}

/**
 * Clean and moderate gift message
 * @param message - The raw gift message
 * @param strictMode - Whether to apply stricter filtering
 * @returns Moderated message or error
 */
export function moderateGiftMessage(
  message: string,
  strictMode: boolean = false,
): { success: boolean; message?: string; error?: string } {
  // Trim whitespace
  const trimmed = message.trim();

  // Check length (max 500 characters)
  if (trimmed.length === 0) {
    return { success: false, error: "Gift message cannot be empty" };
  }

  if (trimmed.length > 500) {
    return { success: false, error: "Gift message must be 500 characters or less" };
  }

  // Check for inappropriate content
  if (containsInappropriateContent(trimmed)) {
    return {
      success: false,
      error: "Gift message contains inappropriate content. Please revise your message.",
    };
  }

  // Check for excessive caps (yelling)
  if (strictMode) {
    const capsCount = (trimmed.match(/[A-Z]/g) || []).length;
    const lettersCount = (trimmed.match(/[a-zA-Z]/g) || []).length;

    if (lettersCount > 0 && capsCount / lettersCount > 0.7) {
      return {
        success: false,
        error: "Please use normal capitalization in your gift message.",
      };
    }
  }

  // Check for excessive special characters or emojis
  if (strictMode) {
    const specialCharsCount = (trimmed.match(/[^a-zA-Z0-9\s.,!?'"()-]/g) || []).length;

    if (specialCharsCount > 20) {
      return {
        success: false,
        error: "Gift message contains too many special characters or emojis.",
      };
    }
  }

  // Check for repetitive characters (e.g., "aaaaaaa" or "!!!!!!")
  const repetitivePattern = /(.)\1{5,}/;
  if (repetitivePattern.test(trimmed)) {
    return {
      success: false,
      error: "Gift message contains excessive repetitive characters.",
    };
  }

  // Check for URLs or email addresses (spam protection)
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  if (urlPattern.test(trimmed)) {
    return {
      success: false,
      error: "Gift messages cannot contain URLs or email addresses.",
    };
  }

  // Check for phone numbers (privacy protection)
  const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  if (phonePattern.test(trimmed)) {
    return {
      success: false,
      error: "Gift messages cannot contain phone numbers.",
    };
  }

  // Message passed all checks
  return { success: true, message: trimmed };
}

/**
 * Sanitize gift message for HTML display
 * Escapes HTML entities to prevent XSS
 */
export function sanitizeGiftMessage(message: string): string {
  return message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Format gift message for display
 * Preserves line breaks and basic formatting
 */
export function formatGiftMessageForDisplay(message: string): string {
  const sanitized = sanitizeGiftMessage(message);

  // Convert line breaks to <br> tags
  return sanitized.replace(/\n/g, "<br>");
}

/**
 * Truncate gift message for preview
 */
export function truncateGiftMessage(message: string, maxLength: number = 100): string {
  if (message.length <= maxLength) {
    return message;
  }

  return message.substring(0, maxLength).trim() + "...";
}

/**
 * Get character count information for gift message
 */
export function getGiftMessageCharacterInfo(message: string): {
  count: number;
  remaining: number;
  percentage: number;
  isValid: boolean;
} {
  const count = message.length;
  const maxLength = 500;
  const remaining = maxLength - count;
  const percentage = (count / maxLength) * 100;
  const isValid = count <= maxLength;

  return {
    count,
    remaining,
    percentage,
    isValid,
  };
}

/**
 * Validate gift message length in real-time
 */
export function isGiftMessageLengthValid(message: string): boolean {
  return message.length <= 500;
}
