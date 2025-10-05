"use client";

import { getAddresses } from "@/actions/get-addresses.action";
import { AddressForm } from "@/components/address-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatAddressMultiLine } from "@/lib/address-utils";
import type { Address } from "@prisma/client";
import { Check, MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AddressSelectorProps {
  selectedAddressId?: string;
  onSelect: (address: Address) => void;
}

export function AddressSelector({ selectedAddressId, onSelect }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedAddressId);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const result = await getAddresses();
      if (result.error) {
        toast.error(result.error);
      } else {
        const fetchedAddresses = result.addresses || [];
        setAddresses(fetchedAddresses);

        // Auto-select default address if none selected
        if (!selectedId && fetchedAddresses.length > 0) {
          const defaultAddress = fetchedAddresses.find((addr) => addr.isDefault) || fetchedAddresses[0];
          setSelectedId(defaultAddress.id);
          onSelect(defaultAddress);
        }
      }
    } catch {
      toast.error("Failed to load addresses.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (addressId: string) => {
    const address = addresses.find((addr) => addr.id === addressId);
    if (address) {
      setSelectedId(addressId);
      onSelect(address);
    }
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    fetchAddresses();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <>
        <div className="rounded-lg border-2 border-dashed p-6 text-center">
          <MapPin className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <p className="mb-2 font-medium">No delivery addresses</p>
          <p className="text-muted-foreground mb-4 text-sm">Add your first address to continue</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Address
          </Button>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Delivery Address</DialogTitle>
            </DialogHeader>
            <AddressForm onSuccess={handleAddSuccess} onCancel={() => setShowAddDialog(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Add New Button */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Select Delivery Address</h3>
          <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>

        {/* Address Radio Group */}
        <RadioGroup value={selectedId} onValueChange={handleSelect}>
          <div className="space-y-3">
            {addresses.map((address) => {
              const addressLines = formatAddressMultiLine(address);
              const isSelected = selectedId === address.id;

              return (
                <div key={address.id} className="relative">
                  <Label
                    htmlFor={address.id}
                    className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-primary ring-2"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    <RadioGroupItem value={address.id} id={address.id} className="mt-1" />

                    <div className="flex-1 space-y-1">
                      {/* Default Badge */}
                      {address.isDefault && (
                        <div className="bg-primary/10 text-primary mb-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                          <Check className="mr-1 h-3 w-3" />
                          Default
                        </div>
                      )}

                      {/* Address Lines */}
                      {addressLines.map((line, index) => (
                        <p key={index} className={`text-sm ${index === 0 ? "font-semibold" : "text-muted-foreground"}`}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Delivery Address</DialogTitle>
          </DialogHeader>
          <AddressForm onSuccess={handleAddSuccess} onCancel={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
