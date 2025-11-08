"use client";

import { prismaMergeGuestCart } from "@/actions/prisma-merge-guest-cart.action";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface Props {
  userId: string;
  sessionId: string;
}

/**
 * Client component that handles merging guest cart with user cart on mount.
 * This allows the Server Action to properly delete cookies since it's called
 * from a Client Component event handler (useEffect) rather than during
 * Server Component render.
 */
export default function CartMergeHandler({ userId, sessionId }: Props) {
  const router = useRouter();
  const hasMerged = useRef(false);

  useEffect(() => {
    // Only merge once
    if (hasMerged.current) return;
    hasMerged.current = true;

    const mergeCarts = async () => {
      const result = await prismaMergeGuestCart({ userId, sessionId });
      if (result.success) {
        // Refresh the page to show the merged cart
        router.refresh();
      }
    };

    mergeCarts();
  }, [userId, sessionId, router]);

  return null;
}
