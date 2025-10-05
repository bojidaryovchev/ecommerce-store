"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatGiftMessageForDisplay } from "@/lib/gift-message-utils";
import { Gift } from "lucide-react";
import type React from "react";

interface GiftMessageCardProps {
  message: string;
  senderName?: string | null;
  className?: string;
  variant?: "default" | "compact" | "elegant";
}

/**
 * Gift Message Card Component
 * Displays a beautifully formatted gift message for orders
 * Used in order confirmations, order details, and packing slips
 */
const GiftMessageCard: React.FC<GiftMessageCardProps> = ({
  message,
  senderName,
  className = "",
  variant = "default",
}) => {
  if (!message || message.trim() === "") {
    return null;
  }

  // Compact variant (for smaller displays)
  if (variant === "compact") {
    return (
      <div className={`rounded-md border border-blue-200 bg-blue-50 p-3 ${className}`}>
        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-blue-700">
          <Gift className="h-3 w-3" />
          <span>Gift Message</span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">{message}</p>
        {senderName && <p className="mt-2 text-xs text-gray-600 italic">— {senderName}</p>}
      </div>
    );
  }

  // Elegant variant (for packing slips and printable displays)
  if (variant === "elegant") {
    return (
      <div className={`rounded-lg border-2 border-gray-300 bg-white p-6 shadow-sm ${className}`}>
        <div className="mb-4 flex items-center justify-center gap-2 border-b border-gray-200 pb-3">
          <Gift className="h-5 w-5 text-gray-600" />
          <h3 className="font-serif text-lg font-semibold text-gray-800">Gift Message</h3>
        </div>
        <div
          className="prose prose-sm mx-auto max-w-none font-serif text-gray-700"
          dangerouslySetInnerHTML={{ __html: formatGiftMessageForDisplay(message) }}
        />
        {senderName && <p className="mt-4 text-right font-serif text-sm text-gray-600 italic">— {senderName}</p>}
      </div>
    );
  }

  // Default variant (for order details and confirmations)
  return (
    <Card className={`border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-blue-100 p-2">
            <Gift className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Gift Message</h3>
            <p className="text-xs text-gray-600">A special message is included with this order</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-white p-4 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">{message}</p>
          {senderName && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-sm text-gray-600 italic">With love from,</p>
              <p className="text-base font-semibold text-gray-800">{senderName}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GiftMessageCard;
