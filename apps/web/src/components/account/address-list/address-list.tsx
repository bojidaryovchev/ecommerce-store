"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteAddress } from "@/mutations/addresses";
import type { Address } from "@ecommerce/database";
import { MapPin, Pencil, Star, Trash2 } from "lucide-react";
import React, { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { AddressFormDialog } from "../address-form-dialog";

interface Props {
  addresses: Address[];
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  NL: "Netherlands",
  BE: "Belgium",
};

const AddressList: React.FC<Props> = ({ addresses }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteAddress(deleteId);
      if (result.success) {
        toast.success("Address deleted");
        setDeleteId(null);
      } else {
        toast.error(result.error);
      }
    });
  };

  if (addresses.length === 0) {
    return (
      <div className="py-12 text-center">
        <MapPin className="text-muted-foreground mx-auto h-12 w-12" />
        <h3 className="mt-4 text-lg font-semibold">No addresses yet</h3>
        <p className="text-muted-foreground mt-2">Add a shipping or billing address to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <Card key={address.id}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={address.type === "shipping" ? "default" : "secondary"}>
                    {address.type === "shipping" ? "Shipping" : "Billing"}
                  </Badge>
                  {address.isDefault && (
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Default
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <AddressFormDialog
                    address={address}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    }
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(address.id)}>
                    <Trash2 className="text-destructive h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
              <div className="text-sm">
                <p className="font-medium">{address.name}</p>
                <p className="text-muted-foreground">{address.line1}</p>
                {address.line2 && <p className="text-muted-foreground">{address.line2}</p>}
                <p className="text-muted-foreground">
                  {address.city}
                  {address.state ? `, ${address.state}` : ""} {address.postalCode}
                </p>
                <p className="text-muted-foreground">{COUNTRY_NAMES[address.country] ?? address.country}</p>
                {address.phone && <p className="text-muted-foreground mt-1">{address.phone}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { AddressList };
