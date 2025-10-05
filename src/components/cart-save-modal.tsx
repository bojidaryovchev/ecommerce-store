"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface CartSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (email: string) => Promise<void>;
  itemCount: number;
  cartTotal: number;
}

export function CartSaveModal({ isOpen, onClose, onSave, itemCount, cartTotal }: CartSaveModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await onSave(email);
      toast.success("Cart saved! We'll send you a reminder if you forget to complete your purchase.");
      onClose();
    } catch (err) {
      console.error("Failed to save cart:", err);
      setError("Failed to save cart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <ShoppingCart className="text-primary h-8 w-8" />
          </div>
          <DialogTitle className="text-center text-2xl">Don&apos;t lose your cart!</DialogTitle>
          <DialogDescription className="text-center text-base">
            Save your {itemCount} item{itemCount !== 1 ? "s" : ""} ({formatCurrency(cartTotal)}) and we&apos;ll send you
            a reminder to complete your purchase.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="bg-muted text-muted-foreground rounded-lg p-3 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <span>
                We&apos;ll send you a reminder email if you don&apos;t complete your purchase. You can come back anytime
                to finish checkout!
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save My Cart"
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={handleSkip} disabled={isLoading} className="w-full">
              No thanks, I&apos;ll remember
            </Button>
          </div>

          <p className="text-muted-foreground text-center text-xs">
            We respect your privacy. You can unsubscribe from reminders anytime.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
