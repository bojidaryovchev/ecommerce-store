import { MailboxHeader, ThreadListLoader } from "@/components/admin";
import { TableSkeleton } from "@/components/common";
import { THREAD_VIEWS, type ThreadView } from "@ecommerce/mailbox";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Mailbox | Admin",
};

type Props = {
  searchParams: Promise<{ view?: string; page?: string }>;
};

const AdminMailboxPage: React.FC<Props> = async ({ searchParams }) => {
  const params = await searchParams;
  const view: ThreadView = THREAD_VIEWS.includes(params.view as ThreadView) ? (params.view as ThreadView) : "open";
  const page = Math.max(1, Number(params.page) || 1);

  return (
    <MailboxHeader>
      <Suspense key={`${view}-${page}`} fallback={<TableSkeleton />}>
        <ThreadListLoader view={view} page={page} />
      </Suspense>
    </MailboxHeader>
  );
};

export default AdminMailboxPage;
