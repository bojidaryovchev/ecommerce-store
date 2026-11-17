import { Pagination } from "@/components/common/pagination";
import { getPendingSyncChanges } from "@/queries/supplier-sync";
import React from "react";
import { SyncChangesTable } from "./sync-changes-table";

type Props = {
  page?: number;
};

const SyncChangesLoader: React.FC<Props> = async ({ page = 1 }) => {
  const { data: changes, total, pageCount } = await getPendingSyncChanges({ page });

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Review queue {total > 0 && `(${total})`}</h2>
      <SyncChangesTable changes={changes} />
      <Pagination page={page} pageCount={pageCount} />
    </section>
  );
};

export { SyncChangesLoader };
