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
import { formatCurrency, formatDate } from "@/lib/utils";
import { deletePromotionCode, togglePromotionCode } from "@/mutations/promotions";
import type { getPromotionCodes } from "@/queries/promotions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import toast from "react-hot-toast";

type PromotionCodeData = Awaited<ReturnType<typeof getPromotionCodes>>["data"];

interface Props {
  promotionCodes: PromotionCodeData;
}

const PromotionsTable: React.FC<Props> = ({ promotionCodes }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = (id: string) => {
    startTransition(async () => {
      const result = await togglePromotionCode(id);
      if (result.success) {
        toast.success(result.data.active ? "Promotion code activated" : "Promotion code deactivated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    onOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedId) return;

    setIsDeleting(true);
    try {
      const result = await deletePromotionCode(selectedId);
      if (result.success) {
        toast.success("Promotion code deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to delete promotion code");
    } finally {
      setIsDeleting(false);
      onClose();
      setSelectedId(null);
    }
  };

  const formatDiscount = (promo: PromotionCodeData[number]) => {
    if (promo.coupon.percentOff) {
      return `${promo.coupon.percentOff}% off`;
    }
    if (promo.coupon.amountOff) {
      return formatCurrency(promo.coupon.amountOff, promo.coupon.currency ?? "usd");
    }
    return "—";
  };

  if (promotionCodes.length === 0) {
    return (
      <div className="border-border rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground mb-4">No promotion codes found</p>
        <Button asChild>
          <Link href="/admin/promotions/new">Create your first code</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>CODE</TableHead>
            <TableHead>COUPON</TableHead>
            <TableHead>DISCOUNT</TableHead>
            <TableHead>REDEMPTIONS</TableHead>
            <TableHead>EXPIRES</TableHead>
            <TableHead>STATUS</TableHead>
            <TableHead>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promotionCodes.map((promo) => (
            <TableRow key={promo.id}>
              <TableCell>
                <code className="bg-muted rounded px-2 py-1 text-sm font-medium">{promo.code}</code>
              </TableCell>
              <TableCell className="text-sm">{promo.coupon.name ?? "Unnamed"}</TableCell>
              <TableCell>{formatDiscount(promo)}</TableCell>
              <TableCell>
                {promo.timesRedeemed}
                {promo.maxRedemptions ? ` / ${promo.maxRedemptions}` : ""}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {promo.expiresAt ? formatDate(promo.expiresAt) : "Never"}
              </TableCell>
              <TableCell>
                <Badge variant={promo.active ? "default" : "secondary"}>{promo.active ? "Active" : "Inactive"}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" disabled={isPending} onClick={() => handleToggle(promo.id)}>
                    {promo.active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(promo.id)}
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
            <DialogTitle>Delete Promotion Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this promotion code? It will be deactivated in Stripe and removed from
              your database.
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

export { PromotionsTable };
