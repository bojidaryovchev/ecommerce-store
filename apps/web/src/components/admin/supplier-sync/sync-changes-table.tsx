"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { applySyncChangeAction, dismissSyncChangeAction } from "@/mutations/supplier-sync";
import type { getPendingSyncChanges } from "@/queries/supplier-sync";
import { LOCKABLE_FIELD_LABELS, isLockableField } from "@ecommerce/supplier-sync/locks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";
import toast from "react-hot-toast";
import { formatAmount, formatDateTime, formatValue } from "./format";

type Change = Awaited<ReturnType<typeof getPendingSyncChanges>>["data"][number];

const COPY: Record<Change["type"], { label: string; apply: string; dismiss: string }> = {
  new_product: { label: "New product", apply: "Publish", dismiss: "Keep as draft" },
  price_change: { label: "Price change", apply: "Use new price", dismiss: "Keep our price" },
  restored: { label: "Back at supplier", apply: "Publish again", dismiss: "Keep unpublished" },
  locked_field_changed: { label: "Supplier changed a field we edited", apply: "Use theirs", dismiss: "Keep ours" },
  removed: { label: "Removed by supplier", apply: "OK", dismiss: "Dismiss" },
};

function describe(change: Change): React.ReactNode {
  const currency = change.supplierProduct.currency;
  switch (change.type) {
    case "new_product": {
      const value = (change.newValue ?? {}) as { priceAmount?: number | null };
      return <>Supplier price: {formatAmount(value.priceAmount ?? null, currency)}</>;
    }
    case "price_change": {
      const before = typeof change.previousValue === "number" ? change.previousValue : null;
      const after = typeof change.newValue === "number" ? change.newValue : null;
      const percent = before && after ? Math.round(((after - before) / before) * 1000) / 10 : null;
      return (
        <>
          {formatAmount(before, currency)} → <strong>{formatAmount(after, currency)}</strong>
          {percent !== null && (
            <span className={percent > 0 ? "text-destructive" : "text-green-600"}>
              {" "}
              ({percent > 0 ? "+" : ""}
              {percent}%)
            </span>
          )}
        </>
      );
    }
    case "locked_field_changed": {
      const field = change.field && isLockableField(change.field) ? LOCKABLE_FIELD_LABELS[change.field] : change.field;
      const show = (value: unknown) => (change.field === "price" ? formatAmount(value, currency) : formatValue(value));
      return (
        <>
          <span className="font-medium">{field}:</span> supplier now has “{show(change.newValue)}”
        </>
      );
    }
    case "restored":
      return <>The supplier lists this product again.</>;
    case "removed":
      return <>Unpublished automatically.</>;
  }
}

interface Props {
  changes: Change[];
}

const SyncChangesTable: React.FC<Props> = ({ changes }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const act = (changeId: string, action: "apply" | "dismiss") => {
    startTransition(async () => {
      const result =
        action === "apply" ? await applySyncChangeAction(changeId) : await dismissSyncChangeAction(changeId);
      if (!result.success) toast.error(result.error);
      router.refresh();
    });
  };

  if (changes.length === 0) {
    return (
      <div className="border-border rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground">Nothing to review</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>PRODUCT</TableHead>
          <TableHead>CHANGE</TableHead>
          <TableHead>DETAILS</TableHead>
          <TableHead>DETECTED</TableHead>
          <TableHead>ACTIONS</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {changes.map((change) => {
          const copy = COPY[change.type];
          return (
            <TableRow key={change.id}>
              <TableCell className="max-w-xs">
                {change.product ? (
                  <Link href={`/admin/products/${change.product.id}`} className="font-medium hover:underline">
                    {change.product.name}
                  </Link>
                ) : (
                  <span className="font-medium">{change.supplierProduct.name}</span>
                )}
                {change.supplierProduct.permalink && (
                  <a
                    href={change.supplierProduct.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground block text-xs hover:underline"
                  >
                    View at supplier
                  </a>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={change.type === "price_change" ? "default" : "outline"}>{copy.label}</Badge>
              </TableCell>
              <TableCell className="max-w-md text-sm whitespace-normal">{describe(change)}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{formatDateTime(change.updatedAt)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" disabled={isPending} onClick={() => act(change.id, "apply")}>
                    {copy.apply}
                  </Button>
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => act(change.id, "dismiss")}>
                    {copy.dismiss}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export { SyncChangesTable };
