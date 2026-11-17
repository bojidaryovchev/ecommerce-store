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
import { useTranslations } from "next-intl";
import React, { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { AddressFormDialog } from "../address-form-dialog";

interface Props {
  addresses: Address[];
}

const AddressList: React.FC<Props> = ({ addresses }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("account.addressList");
  const tAddress = useTranslations("account.address");

  /** Country names live in the `account.address.countries` messages; unknown codes are shown as they are. */
  const countryName = (code: string) => (tAddress.has(`countries.${code}`) ? tAddress(`countries.${code}`) : code);

  const handleDelete = () => {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteAddress(deleteId);
      if (result.success) {
        toast.success(t("deleted"));
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
        <h3 className="mt-4 text-lg font-semibold">{t("emptyTitle")}</h3>
        <p className="text-muted-foreground mt-2">{t("emptyDescription")}</p>
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
                    {address.type === "shipping" ? tAddress("types.shipping") : tAddress("types.billing")}
                  </Badge>
                  {address.isDefault && (
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {t("default")}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <AddressFormDialog
                    address={address}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">{t("edit")}</span>
                      </Button>
                    }
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(address.id)}>
                    <Trash2 className="text-destructive h-4 w-4" />
                    <span className="sr-only">{t("delete")}</span>
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
                <p className="text-muted-foreground">{countryName(address.country)}</p>
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
            <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
            <DialogDescription>{t("deleteDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {t("deleteDialog.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { AddressList };
