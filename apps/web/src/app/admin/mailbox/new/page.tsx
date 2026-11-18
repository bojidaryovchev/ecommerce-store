import { ComposeLoader } from "@/components/admin";
import { TableSkeleton } from "@/components/common";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "New message | Admin",
};

type Props = {
  searchParams: Promise<{ orderId?: string; to?: string }>;
};

const AdminMailboxNewPage: React.FC<Props> = async ({ searchParams }) => {
  const { orderId, to } = await searchParams;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/mailbox">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Mailbox
        </Link>
      </Button>
      <h1 className="text-3xl font-bold">New message</h1>
      <Suspense fallback={<TableSkeleton />}>
        <ComposeLoader orderId={orderId} to={to} />
      </Suspense>
    </div>
  );
};

export default AdminMailboxNewPage;
