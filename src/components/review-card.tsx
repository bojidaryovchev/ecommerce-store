"use client";

import { deleteReview } from "@/actions/delete-review.action";
import ConfirmDialog from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReviewWithUser } from "@/lib/review-utils";
import { formatTimeAgo } from "@/lib/review-utils";
import { Edit2, ShieldCheck, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { StarRating } from "./star-rating";

interface ReviewCardProps {
  review: ReviewWithUser;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Review Card Component
 * - Displays individual review with all details
 * - Shows user info and verified badge
 * - Edit/delete buttons for own reviews
 * - Admin can moderate reviews
 */
export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const currentUserId = session?.user?.id;
  const isOwnReview = currentUserId === review.userId;
  const userRoles = session?.user?.roles || [];
  const isAdmin = userRoles.includes("ADMIN") || userRoles.includes("SUPER_ADMIN");

  const canEdit = isOwnReview && !review.editedAt; // Can only edit if not already edited
  const canDelete = isOwnReview || isAdmin;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteReview(review.id);
      toast.success("Review deleted successfully");
      onDelete?.();
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete review");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="space-y-4 rounded-lg border bg-white p-6 transition-shadow hover:shadow-md">
        {/* Header: User Info and Rating */}
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

            {/* User Name and Date */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-gray-900">{review.user.name || "Anonymous"}</p>
                {review.isVerifiedPurchase && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Purchase
                  </Badge>
                )}
                {!review.isApproved && (
                  <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
                    Pending Approval
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
          {(canEdit || canDelete) && (
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit} className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Review Title */}
        {review.title && <h4 className="text-lg font-semibold text-gray-900">{review.title}</h4>}

        {/* Review Comment */}
        {review.comment && <p className="leading-relaxed whitespace-pre-wrap text-gray-700">{review.comment}</p>}

        {/* Edited Timestamp */}
        {review.editedAt && <p className="text-xs text-gray-500 italic">Edited {formatTimeAgo(review.editedAt)}</p>}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Review"
        description="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
      />
    </>
  );
}
