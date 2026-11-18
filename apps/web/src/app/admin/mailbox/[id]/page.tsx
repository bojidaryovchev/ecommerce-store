import { ThreadLoader } from "@/components/admin";
import { TableSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Conversation | Admin",
};

type Props = {
  params: Promise<{ id: string }>;
};

const AdminMailboxThreadPage: React.FC<Props> = async ({ params }) => {
  const { id } = await params;

  return (
    <Suspense fallback={<TableSkeleton />}>
      <ThreadLoader id={id} />
    </Suspense>
  );
};

export default AdminMailboxThreadPage;
