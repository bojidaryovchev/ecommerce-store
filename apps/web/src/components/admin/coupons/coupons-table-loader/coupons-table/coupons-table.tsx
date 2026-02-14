"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDisclosure } from "@/hooks/use-disclosure";
import { formatCurrency } from "@/lib/utils";
import { deleteCoupon } from "@/mutations/coupons";
import type { Coupon } from "@ecommerce/database";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  coupons: Coupon[];
}

const CouponsTable: React.FC<Props> = ({ coupons }) => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    onOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedCoupon) return;

    setIsDeleting(true);
    try {
      const result = await deleteCoupon(selectedCoupon.id);

      if (result.success) {
        toast.success("Coupon deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to delete coupon");
    } finally {
      setIsDeleting(false);
      onClose();
      setSelectedCoupon(null);
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.percentOff) {
      return `${coupon.percentOff}% off`;
    }
    if (coupon.amountOff) {
      return formatCurrency(coupon.amountOff, coupon.currency ?? "usd");
    }
    return "—";
  };

  const formatDuration = (coupon: Coupon) => {
    if (coupon.duration === "forever") return "Forever";
    if (coupon.duration === "once") return "Once";
    if (coupon.duration === "repeating") return `${coupon.durationInMonths} months`;
    return coupon.duration;
  };

  if (coupons.length === 0) {
    return (
      <div className="border-border rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground mb-4">No coupons found</p>
        <Button asChild>
          <Link href="/admin/coupons/new">Create your first coupon</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NAME</TableHead>
            <TableHead>DISCOUNT</TableHead>
            <TableHead>DURATION</TableHead>
            <TableHead>REDEMPTIONS</TableHead>
            <TableHead>STATUS</TableHead>
            <TableHead>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell className="font-medium">{coupon.name ?? "Unnamed coupon"}</TableCell>
              <TableCell>{formatDiscount(coupon)}</TableCell>
              <TableCell>{formatDuration(coupon)}</TableCell>
              <TableCell>
                {coupon.timesRedeemed}
                {coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ""}
              </TableCell>
              <TableCell>
                <Badge variant={coupon.valid ? "default" : "secondary"}>{coupon.valid ? "Active" : "Inactive"}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/coupons/${coupon.id}`}>Edit</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(coupon)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedCoupon?.name ?? "this coupon"}</strong>? This will also
              delete all associated promotion codes. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { CouponsTable };
