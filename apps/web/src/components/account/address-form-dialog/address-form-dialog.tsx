"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createAddress, updateAddress } from "@/mutations/addresses";
import type { Address } from "@ecommerce/database";
import { useTranslations } from "next-intl";
import React, { useState, useTransition } from "react";
import toast from "react-hot-toast";

interface Props {
  address?: Address;
  trigger: React.ReactNode;
}

/** Country names live in the `account.address.countries` messages. We deliver in Bulgaria only. */
const COUNTRY_CODES = ["BG"];

const AddressFormDialog: React.FC<Props> = ({ address, trigger }) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("account.addressForm");
  const tAddress = useTranslations("account.address");

  const isEditing = !!address;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name") as string,
      line1: formData.get("line1") as string,
      line2: (formData.get("line2") as string) || undefined,
      city: formData.get("city") as string,
      state: (formData.get("state") as string) || undefined,
      postalCode: formData.get("postalCode") as string,
      country: formData.get("country") as string,
      phone: (formData.get("phone") as string) || undefined,
      type: formData.get("type") as "shipping" | "billing",
      isDefault: formData.get("isDefault") === "on",
    };

    startTransition(async () => {
      const result = isEditing ? await updateAddress(address.id, data) : await createAddress(data);

      if (result.success) {
        toast.success(isEditing ? t("updated") : t("added"));
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{isEditing ? t("editDescription") : t("addDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">{t("fields.name")}</Label>
              <Input id="name" name="name" required defaultValue={address?.name ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="line1">{t("fields.line1")}</Label>
              <Input id="line1" name="line1" required defaultValue={address?.line1 ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="line2">{t("fields.line2")}</Label>
              <Input id="line2" name="line2" defaultValue={address?.line2 ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t("fields.city")}</Label>
              <Input id="city" name="city" required defaultValue={address?.city ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">{t("fields.state")}</Label>
              <Input id="state" name="state" defaultValue={address?.state ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">{t("fields.postalCode")}</Label>
              <Input id="postalCode" name="postalCode" required defaultValue={address?.postalCode ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t("fields.country")}</Label>
              <Select name="country" defaultValue={address?.country ?? "BG"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...new Set([...COUNTRY_CODES, ...(address?.country ? [address.country] : [])])].map((code) => (
                    <SelectItem key={code} value={code}>
                      {tAddress(`countries.${code}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="phone">{t("fields.phone")}</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={address?.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t("fields.type")}</Label>
              <Select name="type" defaultValue={address?.type ?? "shipping"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipping">{tAddress("types.shipping")}</SelectItem>
                  <SelectItem value="billing">{tAddress("types.billing")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 self-end">
              <Switch id="isDefault" name="isDefault" defaultChecked={address?.isDefault ?? false} />
              <Label htmlFor="isDefault">{t("fields.isDefault")}</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : isEditing ? t("save") : t("add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { AddressFormDialog };
