"use client";

import { createAddress } from "@/actions/create-address.action";
import { updateAddress } from "@/actions/update-address.action";
import { acceptAddressSuggestion } from "@/actions/validate-address.action";
import { AddressSuggestionModal } from "@/components/address-validation-feedback";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/address-utils";
import type { ValidationResult } from "@/lib/address-validation";
import { addressSchema } from "@/schemas/address.schema";
import type { Address } from "@prisma/client";
import { useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";

interface AddressFormProps {
  address?: Address;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const [formData, setFormData] = useState({
    fullName: address?.fullName || "",
    company: address?.company || "",
    address1: address?.address1 || "",
    address2: address?.address2 || "",
    city: address?.city || "",
    state: address?.state || "",
    postalCode: address?.postalCode || "",
    country: address?.country || "US",
    phone: address?.phone || "",
    isDefault: address?.isDefault || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [savedAddressId, setSavedAddressId] = useState<string | null>(null);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate form data
      addressSchema.omit({ userId: true }).parse(formData);

      const result = address
        ? await updateAddress(address.id, { ...formData, userId: address.userId })
        : await createAddress(formData as z.infer<typeof addressSchema>);

      if (result.error) {
        toast.error(result.error);
      } else {
        // Check if validation result suggests an alternative address
        const validation = (result as { validation?: ValidationResult }).validation;

        if (validation?.suggestion && validation.confidence < 80) {
          // Show suggestion modal if address needs improvement
          setValidationResult(validation);
          setSavedAddressId((result as { address: Address }).address.id);
          setShowSuggestionModal(true);
        } else {
          // Address is good or no suggestions available
          toast.success(address ? "Address updated successfully!" : "Address added successfully!");
          onSuccess?.();
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptSuggestion = async () => {
    if (!savedAddressId || !validationResult?.suggestion) return;

    setIsSubmitting(true);
    try {
      const result = await acceptAddressSuggestion(savedAddressId, validationResult.suggestion);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Address updated with suggested corrections!");
        setShowSuggestionModal(false);
        onSuccess?.();
      }
    } catch {
      toast.error("Failed to update address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeepOriginal = () => {
    toast.success(address ? "Address updated successfully!" : "Address added successfully!");
    setShowSuggestionModal(false);
    onSuccess?.();
  };

  return (
    <>
      {validationResult && (
        <AddressSuggestionModal
          isOpen={showSuggestionModal}
          onClose={() => setShowSuggestionModal(false)}
          onAcceptSuggestion={handleAcceptSuggestion}
          onKeepOriginal={handleKeepOriginal}
          validation={validationResult}
          isLoading={isSubmitting}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fullName">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="John Doe"
            />
            {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
          </div>

          {/* Company */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company">Company (Optional)</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange("company", e.target.value)}
              placeholder="Acme Inc."
            />
            {errors.company && <p className="text-sm text-red-500">{errors.company}</p>}
          </div>

          {/* Address Line 1 */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address1">
              Address Line 1 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address1"
              value={formData.address1}
              onChange={(e) => handleChange("address1", e.target.value)}
              placeholder="123 Main St"
            />
            {errors.address1 && <p className="text-sm text-red-500">{errors.address1}</p>}
          </div>

          {/* Address Line 2 */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address2">Address Line 2 (Optional)</Label>
            <Input
              id="address2"
              value={formData.address2}
              onChange={(e) => handleChange("address2", e.target.value)}
              placeholder="Apt 4B"
            />
            {errors.address2 && <p className="text-sm text-red-500">{errors.address2}</p>}
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">
              City <span className="text-red-500">*</span>
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="New York"
            />
            {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
          </div>

          {/* State/Province */}
          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
              placeholder="NY"
            />
            {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
          </div>

          {/* Postal Code */}
          <div className="space-y-2">
            <Label htmlFor="postalCode">
              Postal Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => handleChange("postalCode", e.target.value)}
              placeholder="10001"
            />
            {errors.postalCode && <p className="text-sm text-red-500">{errors.postalCode}</p>}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">
              Country <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.country} onValueChange={(value) => handleChange("country", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+1234567890"
            />
            <p className="text-muted-foreground text-xs">Include country code (e.g., +1 for US)</p>
            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          </div>

          {/* Set as Default */}
          <div className="flex items-center space-x-2 sm:col-span-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) => handleChange("isDefault", checked as boolean)}
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Set as default address
            </Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : address ? "Update Address" : "Add Address"}
          </Button>
        </div>
      </form>
    </>
  );
}
