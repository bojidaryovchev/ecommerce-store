"use client";

import { mergeCarts } from "@/actions/merge-carts.action";
import { clearSessionId, getSessionId, hasSessionId } from "@/lib/session";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface UseCartMergeOptions {
  onMergeComplete?: () => void;
}

/**
 * Hook to automatically merge guest cart into user cart when user logs in
 * This handles the authentication state transition and triggers the merge
 */
export function useCartMerge(options?: UseCartMergeOptions) {
  const { data: session, status } = useSession();
  const [isMerging, setIsMerging] = useState(false);
  const [hasMerged, setHasMerged] = useState(false);

  useEffect(() => {
    // Only attempt merge if:
    // 1. User is authenticated
    // 2. Not already merging
    // 3. Haven't already merged in this session
    // 4. A guest session exists
    if (status === "authenticated" && !isMerging && !hasMerged && hasSessionId()) {
      const performMerge = async () => {
        try {
          setIsMerging(true);

          const guestSessionId = getSessionId();
          const userId = session?.user?.id;

          if (!userId) {
            console.error("User ID not found in session");
            return;
          }

          // Merge guest cart into user cart
          const mergedCart = await mergeCarts(guestSessionId, userId);

          if (mergedCart && mergedCart.items.length > 0) {
            toast.success("Your cart has been updated");
          }

          // Clear the guest session cookie after successful merge
          clearSessionId();

          // Mark as merged to prevent duplicate merges
          setHasMerged(true);

          // Call optional callback
          options?.onMergeComplete?.();
        } catch (error) {
          console.error("Failed to merge carts:", error);
          toast.error("Failed to merge your cart. Please refresh the page.");
        } finally {
          setIsMerging(false);
        }
      };

      performMerge();
    }
  }, [status, session, isMerging, hasMerged, options]);

  return {
    isMerging,
    hasMerged,
  };
}
