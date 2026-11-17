"use client";

import { Button } from "@/components/ui/button";
import { publishAllNewProductsAction, runSupplierSyncNow } from "@/mutations/supplier-sync";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";
import toast from "react-hot-toast";

interface Props {
  pendingNewProducts: number;
}

const SyncActions: React.FC<Props> = ({ pendingNewProducts }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (mode: "incremental" | "full") => {
    startTransition(async () => {
      const result = await runSupplierSyncNow(mode);
      if (!result.success) {
        toast.error(result.error);
      } else if (result.data.status === "skipped") {
        toast(result.data.message ?? "Sync skipped");
      } else {
        const s = result.data.stats;
        toast.success(
          `Sync done: ${s.created} new, ${s.updated} updated, ${s.removed} removed, ${s.pendingReview} to review` +
            (s.failed > 0 ? `, ${s.failed} failed` : ""),
        );
      }
      router.refresh();
    });
  };

  const publishAll = () => {
    startTransition(async () => {
      const result = await publishAllNewProductsAction();
      if (result.success) {
        toast.success(`Published ${result.data.count} products`);
      } else {
        toast.error(result.error);
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => run("incremental")} disabled={isPending}>
        {isPending ? "Working…" : "Sync now"}
      </Button>
      <Button variant="outline" onClick={() => run("full")} disabled={isPending}>
        Full refresh
      </Button>
      {pendingNewProducts > 0 && (
        <Button variant="secondary" onClick={publishAll} disabled={isPending}>
          Publish all new ({pendingNewProducts})
        </Button>
      )}
    </div>
  );
};

export { SyncActions };
