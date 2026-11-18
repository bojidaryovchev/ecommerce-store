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
import { addressSchema, type AddressInput } from "@/schemas/address.schema";
import type { Address } from "@ecommerce/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface Props {
  address?: Address;
  trigger: React.ReactNode;
}

/** Country names live in the `account.address.countries` messages. We deliver in Bulgaria only. */
const COUNTRY_CODES = ["BG"];

type TextField = "name" | "line1" | "line2" | "city" | "state" | "postalCode" | "phone";

const valuesOf = (address?: Address): AddressInput => ({
  name: address?.name ?? "",
  line1: address?.line1 ?? "",
  line2: address?.line2 ?? "",
  city: address?.city ?? "",
  state: address?.state ?? "",
  postalCode: address?.postalCode ?? "",
  country: address?.country ?? "BG",
  phone: address?.phone ?? "",
  type: address?.type ?? "shipping",
  isDefault: address?.isDefault ?? false,
});

/** Add or edit an address: React Hook Form with the schema the actions check again. */
const AddressFormDialog: React.FC<Props> = ({ address, trigger }) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations("account.addressForm");
  const tAddress = useTranslations("account.address");
  const isEditing = !!address;
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    mode: "onTouched",
    defaultValues: valuesOf(address),
  });

  const onSubmit = async (values: AddressInput) => {
    // null, not undefined, for a field left empty: an edit that clears it must clear it.
    const data = {
      ...values,
      line2: values.line2 || null,
      state: values.state || null,
      phone: values.phone || null,
    };
    const result = isEditing ? await updateAddress(address.id, data) : await createAddress(data);
    if (result.success) {
      toast.success(isEditing ? t("updated") : t("added"));
      setOpen(false);
      if (!isEditing) reset(valuesOf());
    } else {
      toast.error(result.error === "invalid" ? t("errors.invalid") : result.error);
    }
  };

  const message = (name: TextField | "country") =>
    errors[name]?.message ? t(`errors.${errors[name]!.message as TextField}`) : undefined;
  const text = (
    name: TextField,
    label: string,
    options: { required?: boolean; type?: string; wide?: boolean } = {},
  ) => (
    <div className={options.wide ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <Label htmlFor={`address-${name}`}>{label}</Label>
      <Input
        id={`address-${name}`}
        type={options.type}
        {...register(name)}
        aria-invalid={Boolean(message(name))}
        aria-describedby={message(name) ? `address-${name}-error` : undefined}
      />
      {message(name) && (
        <p id={`address-${name}-error`} className="text-destructive text-sm">
          {message(name)}
        </p>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset(valuesOf(address));
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{isEditing ? t("editDescription") : t("addDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {text("name", t("fields.name"), { wide: true })}
            {text("line1", t("fields.line1"), { wide: true })}
            {text("line2", t("fields.line2"), { wide: true })}
            {text("city", t("fields.city"))}
            {text("state", t("fields.state"))}
            {text("postalCode", t("fields.postalCode"))}
            <div className="space-y-2">
              <Label htmlFor="address-country">{t("fields.country")}</Label>
              <Controller
                control={control}
                name="country"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="address-country">
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
                )}
              />
            </div>
            {text("phone", t("fields.phone"), { type: "tel", wide: true })}
            <div className="space-y-2">
              <Label htmlFor="address-type">{t("fields.type")}</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="address-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shipping">{tAddress("types.shipping")}</SelectItem>
                      <SelectItem value="billing">{tAddress("types.billing")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-center gap-2 self-end">
              <Controller
                control={control}
                name="isDefault"
                render={({ field }) => (
                  <Switch id="address-isDefault" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label htmlFor="address-isDefault">{t("fields.isDefault")}</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : isEditing ? t("save") : t("add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { AddressFormDialog };
