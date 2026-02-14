import { AddressFormDialog } from "@/components/account/address-form-dialog";
import { AddressList } from "@/components/account/address-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getAddressesByUserId } from "@/queries/addresses";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Addresses | My Account | Ecommerce Store",
  description: "Manage your shipping and billing addresses",
};

const AddressesContent: React.FC<{ userId: string }> = async ({ userId }) => {
  const addresses = await getAddressesByUserId(userId);

  return <AddressList addresses={addresses} />;
};

const AddressesPage: React.FC = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Addresses</CardTitle>
            <CardDescription>Manage your shipping and billing addresses.</CardDescription>
          </div>
          <AddressFormDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="grid animate-pulse gap-4 sm:grid-cols-2">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-muted h-40 rounded-lg" />
                ))}
              </div>
            }
          >
            <AddressesContent userId={session.user.id} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressesPage;
