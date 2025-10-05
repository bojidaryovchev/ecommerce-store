import { AddressList } from "@/components/address-list";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Addresses",
  description: "Manage your delivery addresses",
};

export default async function AddressesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/account/addresses");
  }

  return (
    <div className="container max-w-7xl py-8">
      <AddressList />
    </div>
  );
}
