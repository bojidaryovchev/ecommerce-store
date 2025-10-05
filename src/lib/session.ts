import Cookies from "js-cookie";

const SESSION_COOKIE_NAME = "cart_session_id";
const SESSION_EXPIRY_DAYS = 30;

/**
 * Generate a unique session ID for guest carts
 */
export function generateSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get session ID from cookies
 * If no session exists, creates one
 */
export function getSessionId(): string {
  // Try to get existing session from cookie
  let sessionId = Cookies.get(SESSION_COOKIE_NAME);

  if (!sessionId) {
    // Generate new session ID
    sessionId = generateSessionId();
    setSessionId(sessionId);
  }

  return sessionId;
}

/**
 * Set session ID in cookies
 * Cookie expires after 30 days
 */
export function setSessionId(sessionId: string): void {
  Cookies.set(SESSION_COOKIE_NAME, sessionId, {
    expires: SESSION_EXPIRY_DAYS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Remove session ID from cookies
 * Used when user logs in and cart is merged
 */
export function clearSessionId(): void {
  Cookies.remove(SESSION_COOKIE_NAME);
}

/**
 * Check if session ID exists
 */
export function hasSessionId(): boolean {
  return !!Cookies.get(SESSION_COOKIE_NAME);
}
