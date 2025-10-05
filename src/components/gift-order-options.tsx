"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getGiftMessageCharacterInfo, moderateGiftMessage, truncateGiftMessage } from "@/lib/gift-message-utils";
import { giftOrderOptionsSchema, type GiftOrderOptions } from "@/schemas/gift-order.schema";
import { Gift, Info } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

interface GiftOrderOptionsProps {
  value?: GiftOrderOptions;
  onChange?: (value: GiftOrderOptions) => void;
  className?: string;
  showPreview?: boolean;
}

/**
 * Gift Order Options Component
 * Allows customers to mark an order as a gift and add a gift message
 */
const GiftOrderOptions: React.FC<GiftOrderOptionsProps> = ({
  value = { isGift: false, giftMessage: null },
  onChange,
  className = "",
  showPreview = true,
}) => {
  const [isGift, setIsGift] = useState(value.isGift || false);
  const [giftMessage, setGiftMessage] = useState(value.giftMessage || "");
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  // Character count info
  const charInfo = getGiftMessageCharacterInfo(giftMessage);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      const result = giftOrderOptionsSchema.safeParse({
        isGift,
        giftMessage: isGift && giftMessage ? giftMessage : null,
      });

      if (result.success) {
        onChange(result.data);
        setError(null);
      }
    }
  }, [isGift, giftMessage, onChange]);

  const handleIsGiftChange = (checked: boolean) => {
    setIsGift(checked);
    if (!checked) {
      setGiftMessage("");
      setError(null);
      setShowError(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setGiftMessage(newMessage);
    setShowError(false);

    // Real-time validation
    if (newMessage.trim() && isGift) {
      const result = moderateGiftMessage(newMessage, false);
      if (!result.success) {
        setError(result.error || null);
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }
  };

  const handleBlur = () => {
    if (giftMessage.trim() && isGift) {
      const result = moderateGiftMessage(giftMessage, true);
      if (!result.success) {
        setError(result.error || null);
        setShowError(true);
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Gift Options
        </CardTitle>
        <CardDescription>Make this order special by adding a gift message</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gift Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isGift"
            checked={isGift}
            onCheckedChange={handleIsGiftChange}
            aria-label="Mark this order as a gift"
          />
          <Label
            htmlFor="isGift"
            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            This is a gift
          </Label>
        </div>

        {/* Gift Message Section */}
        {isGift && (
          <div className="space-y-2">
            <Label htmlFor="giftMessage" className="text-sm font-medium">
              Gift Message (Optional)
            </Label>

            {/* Info Notice */}
            <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                Your gift message will be beautifully formatted and included with the order. No prices will be shown on
                the packing slip.
              </p>
            </div>

            {/* Textarea */}
            <Textarea
              id="giftMessage"
              value={giftMessage}
              onChange={handleMessageChange}
              onBlur={handleBlur}
              placeholder="Write a heartfelt message to the recipient... (e.g., 'Happy Birthday! Wishing you all the best on your special day!')"
              rows={4}
              className={`resize-none ${error && showError ? "border-red-500 focus:border-red-500" : ""}`}
              aria-describedby="giftMessage-error giftMessage-count"
            />

            {/* Character Counter */}
            <div className="flex items-center justify-between text-sm">
              <div id="giftMessage-count" className="text-muted-foreground">
                {charInfo.count} / 500 characters
                {charInfo.remaining <= 50 && charInfo.remaining > 0 && (
                  <span className="ml-2 text-yellow-600">({charInfo.remaining} remaining)</span>
                )}
                {!charInfo.isValid && <span className="ml-2 text-red-600">(Too long!)</span>}
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all ${
                      charInfo.percentage < 80
                        ? "bg-green-500"
                        : charInfo.percentage < 100
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(charInfo.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && showError && (
              <div id="giftMessage-error" className="text-sm text-red-600" role="alert">
                {error}
              </div>
            )}

            {/* Preview */}
            {showPreview && giftMessage.trim() && !error && (
              <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-700">Preview:</h4>
                <div className="rounded-md bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Gift className="h-4 w-4" />
                    <span>Gift Message</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                    {truncateGiftMessage(giftMessage, 200)}
                    {giftMessage.length > 200 && <span className="text-muted-foreground"> (preview truncated)</span>}
                  </p>
                </div>
              </div>
            )}

            {/* Clear Button */}
            {giftMessage.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setGiftMessage("");
                  setError(null);
                  setShowError(false);
                }}
                className="mt-2"
              >
                Clear Message
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GiftOrderOptions;
