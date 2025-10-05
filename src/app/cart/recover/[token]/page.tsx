"use client";

import { recoverCart } from "@/actions/abandoned-cart.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type RecoveryStatus = "loading" | "success" | "expired" | "already-recovered" | "error";

export default function RecoverCartPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<RecoveryStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const handleRecovery = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage("Invalid recovery link");
        return;
      }

      try {
        const result = await recoverCart(token);

        if (result.success) {
          setStatus("success");
          toast.success("Your cart has been restored!");

          // Redirect to cart page after 2 seconds
          setTimeout(() => {
            router.push("/cart");
          }, 2000);
        } else {
          // Determine the specific error type
          if (result.error?.includes("expired")) {
            setStatus("expired");
          } else if (result.error?.includes("already been recovered")) {
            setStatus("already-recovered");
          } else {
            setStatus("error");
            setErrorMessage(result.error || "Failed to recover cart");
          }
        }
      } catch (error) {
        console.error("Recovery error:", error);
        setStatus("error");
        setErrorMessage("An unexpected error occurred");
      }
    };

    handleRecovery();
  }, [token, router]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <Card>
        <CardContent className="pt-8 pb-8">
          {/* Loading State */}
          {status === "loading" && (
            <div className="text-center">
              <Loader2 className="text-primary mx-auto h-16 w-16 animate-spin" />
              <h1 className="mt-6 text-2xl font-bold">Restoring Your Cart</h1>
              <p className="text-muted-foreground mt-2">Please wait while we recover your items...</p>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="mt-6 text-2xl font-bold text-green-600">Cart Restored Successfully!</h1>
              <p className="text-muted-foreground mt-2">Your items have been added back to your cart.</p>
              <p className="text-muted-foreground mt-4 text-sm">Redirecting you to your cart...</p>
              <div className="mt-6 flex justify-center gap-4">
                <Button asChild>
                  <Link href="/cart">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    View Cart
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Expired Token State */}
          {status === "expired" && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <AlertCircle className="h-10 w-10 text-orange-600" />
              </div>
              <h1 className="mt-6 text-2xl font-bold text-orange-600">Recovery Link Expired</h1>
              <p className="text-muted-foreground mt-2">
                This recovery link has expired. Recovery links are valid for 7 days.
              </p>
              <div className="bg-muted mt-6 rounded-lg p-4 text-sm">
                <p className="font-medium">What can you do?</p>
                <ul className="text-muted-foreground mt-2 space-y-1 text-left">
                  <li>• Browse our products and add items to your cart again</li>
                  <li>• Check your email for newer recovery links</li>
                  <li>• Contact support if you need assistance</li>
                </ul>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild variant="default">
                  <Link href="/">Continue Shopping</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Already Recovered State */}
          {status === "already-recovered" && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <AlertCircle className="h-10 w-10 text-blue-600" />
              </div>
              <h1 className="mt-6 text-2xl font-bold text-blue-600">Already Recovered</h1>
              <p className="text-muted-foreground mt-2">
                This cart has already been recovered and can&apos;t be used again.
              </p>
              <div className="bg-muted mt-6 rounded-lg p-4 text-sm">
                <p className="font-medium">What happened?</p>
                <p className="text-muted-foreground mt-2 text-left">
                  You may have already recovered this cart previously, or the items were purchased. Recovery links can
                  only be used once for security reasons.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild variant="default">
                  <Link href="/cart">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    View Cart
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="mt-6 text-2xl font-bold text-red-600">Recovery Failed</h1>
              <p className="text-muted-foreground mt-2">
                {errorMessage || "We couldn't recover your cart. The link may be invalid or expired."}
              </p>
              <div className="bg-muted mt-6 rounded-lg p-4 text-sm">
                <p className="font-medium">Need help?</p>
                <p className="text-muted-foreground mt-2 text-left">
                  If you believe this is an error, please contact our support team with your order details, and
                  we&apos;ll be happy to assist you.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild variant="default">
                  <Link href="/">Continue Shopping</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Help Section */}
      <div className="text-muted-foreground mt-8 text-center text-sm">
        <p>
          Having trouble?{" "}
          <Link href="/contact" className="hover:text-foreground underline">
            Contact our support team
          </Link>
        </p>
      </div>
    </div>
  );
}
