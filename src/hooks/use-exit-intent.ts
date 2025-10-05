import { useEffect, useState } from "react";

interface UseExitIntentOptions {
  threshold?: number; // Pixels from top before triggering
  delay?: number; // Milliseconds to wait before triggering again
  enabled?: boolean;
}

/**
 * Hook to detect when user is about to leave the page (exit intent)
 * Triggers when mouse moves to top of screen (typical browser close/back behavior)
 */
export function useExitIntent(options: UseExitIntentOptions = {}) {
  const { threshold = 20, delay = 1000, enabled = true } = options;
  const [shouldShow, setShouldShow] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (!enabled || hasTriggered) return;

    let delayTimer: NodeJS.Timeout | null = null;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse is leaving from top of screen (typical exit behavior)
      if (e.clientY <= threshold && !hasTriggered) {
        // Add delay to prevent accidental triggers
        delayTimer = setTimeout(() => {
          setShouldShow(true);
          setHasTriggered(true);
        }, 100);
      }
    };

    const handleMouseEnter = () => {
      // Cancel trigger if user moves mouse back into page
      if (delayTimer) {
        clearTimeout(delayTimer);
        delayTimer = null;
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      if (delayTimer) {
        clearTimeout(delayTimer);
      }
    };
  }, [enabled, hasTriggered, threshold]);

  const reset = () => {
    setShouldShow(false);
    // Allow re-triggering after delay
    setTimeout(() => {
      setHasTriggered(false);
    }, delay);
  };

  return { shouldShow, reset };
}
