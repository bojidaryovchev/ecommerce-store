"use client";

import { getPendingReviews, moderateReview } from "@/actions/moderate-review.action";
import ConfirmDialog from "@/components/confirm-dialog";
import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReviewWithUser } from "@/lib/review-utils";
import { formatTimeAgo } from "@/lib/review-utils";
import { Check, Clock, Loader2, MessageSquare, ShieldCheck, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

/**
 * Admin Reviews Client Component
 * - View pending reviews requiring approval
 * - Approve or reject reviews
 * - View all reviews with filters
 */
export function AdminReviewsClient() {
  const [pendingReviews, setPendingReviews] = useState<ReviewWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    reviewId: string;
    action: "approve" | "reject";
  }>({ open: false, reviewId: "", action: "approve" });

  useEffect(() => {
    loadPendingReviews();
  }, []);

  const loadPendingReviews = async () => {
    try {
      setIsLoading(true);
      const reviews = await getPendingReviews();
      setPendingReviews(reviews);
    } catch (error) {
      console.error("Failed to load pending reviews:", error);
      toast.error("Failed to load pending reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async (reviewId: string, isApproved: boolean) => {
    try {
      setProcessingId(reviewId);
      await moderateReview(reviewId, { isApproved });

      toast.success(isApproved ? "Review approved" : "Review rejected");

      // Remove from pending list
      setPendingReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (error) {
      console.error("Failed to moderate review:", error);
      toast.error(error instanceof Error ? error.message : "Failed to moderate review");
    } finally {
      setProcessingId(null);
      setConfirmDialog({ open: false, reviewId: "", action: "approve" });
    }
  };

  const openConfirmDialog = (reviewId: string, action: "approve" | "reject") => {
    setConfirmDialog({ open: true, reviewId, action });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
          <MessageSquare className="h-8 w-8" />
          Review Management
        </h1>
        <p className="mt-2 text-gray-600">Moderate and manage product reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews.length}</div>
            <p className="mt-1 text-xs text-gray-500">Awaiting moderation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Action Required</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews.length}</div>
            <p className="mt-1 text-xs text-gray-500">Reviews need your attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Verified Purchases</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews.filter((r) => r.isVerifiedPurchase).length}</div>
            <p className="mt-1 text-xs text-gray-500">From confirmed buyers</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Check className="mb-4 h-12 w-12 text-green-500" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">All Caught Up!</h3>
                <p className="text-center text-gray-600">There are no pending reviews at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <Card key={review.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Review Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-1 items-start gap-3">
                          {/* User Avatar */}
                          <div className="flex-shrink-0">
                            {review.user.image ? (
                              <Image
                                src={review.user.image}
                                alt={review.user.name || "User"}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                                <span className="text-sm font-medium text-gray-600">
                                  {review.user.name?.charAt(0).toUpperCase() || "?"}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* User Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900">{review.user.name || "Anonymous"}</p>
                              {review.isVerifiedPurchase && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  Verified Purchase
                                </Badge>
                              )}
                              {review.editedAt && (
                                <Badge variant="outline" className="text-gray-500">
                                  Edited
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-3">
                              <StarRating rating={review.rating} size="sm" readonly />
                              <span className="text-sm text-gray-500">{formatTimeAgo(review.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openConfirmDialog(review.id, "approve")}
                            disabled={processingId === review.id}
                            className="gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                          >
                            {processingId === review.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openConfirmDialog(review.id, "reject")}
                            disabled={processingId === review.id}
                            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>

                      {/* Review Content */}
                      {review.title && <h4 className="text-lg font-semibold text-gray-900">{review.title}</h4>}
                      {review.comment && (
                        <p className="leading-relaxed whitespace-pre-wrap text-gray-700">{review.comment}</p>
                      )}
                      {review.editedAt && (
                        <p className="text-xs text-gray-500 italic">Edited {formatTimeAgo(review.editedAt)}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.action === "approve" ? "Approve Review" : "Reject Review"}
        description={
          confirmDialog.action === "approve"
            ? "Are you sure you want to approve this review? It will be visible to all customers."
            : "Are you sure you want to reject this review? It will not be visible to customers."
        }
        confirmText={confirmDialog.action === "approve" ? "Approve" : "Reject"}
        cancelText="Cancel"
        onConfirm={() => handleModerate(confirmDialog.reviewId, confirmDialog.action === "approve")}
      />
    </div>
  );
}
