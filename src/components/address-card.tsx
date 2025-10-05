"use client";

import { deleteAddress } from "@/actions/delete-address.action";
import { setDefaultAddress } from "@/actions/set-default-address.action";
import ConfirmDialog from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatAddressMultiLine } from "@/lib/address-utils";
import type { Address } from "@prisma/client";
import { Check, MapPin, Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface AddressCardProps {
  address: Address;
  onEdit?: (address: Address) => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const addressLines = formatAddressMultiLine(address);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAddress(address.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Address deleted successfully!");
        onDelete?.();
      }
    } catch {
      toast.error("Failed to delete address. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSetDefault = async () => {
    setIsSettingDefault(true);
    try {
      const result = await setDefaultAddress(address.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Default address updated!");
        onSetDefault?.();
      }
    } catch {
      toast.error("Failed to set default address. Please try again.");
    } finally {
      setIsSettingDefault(false);
    }
  };

  return (
    <>
      <Card className="relative">
        <CardContent className="pt-6">
          {/* Default Badge */}
          {address.isDefault && (
            <Badge className="absolute top-4 right-4" variant="default">
              <Star className="mr-1 h-3 w-3" />
              Default
            </Badge>
          )}

          {/* Icon */}
          <div className="text-muted-foreground mb-3 flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            <span className="font-medium">Delivery Address</span>
          </div>

          {/* Address Lines */}
          <div className="space-y-1 text-sm">
            {addressLines.map((line, index) => (
              <p key={index} className={index === 0 ? "font-semibold" : ""}>
                {line}
              </p>
            ))}
          </div>

          {/* Validated Badge */}
          {address.isValidated && (
            <div className="mt-3 flex items-center text-sm text-green-600">
              <Check className="mr-1 h-4 w-4" />
              <span>Verified Address</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-muted/30 flex gap-2 border-t py-3">
          {/* Set as Default Button */}
          {!address.isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetDefault}
              disabled={isSettingDefault}
              className="flex-1"
            >
              {isSettingDefault ? "Setting..." : "Set as Default"}
            </Button>
          )}

          {/* Edit Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(address)}
            className={address.isDefault ? "flex-1" : ""}
          >
            <Pencil className="mr-1 h-4 w-4" />
            Edit
          </Button>

          {/* Delete Button */}
          <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Address"
        description="Are you sure you want to delete this address? This action cannot be undone."
        confirmText="Delete"
      />
    </>
  );
}
