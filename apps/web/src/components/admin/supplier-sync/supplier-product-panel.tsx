"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { followSupplierAction } from "@/mutations/supplier-sync";
import type { getProductSupplierLink } from "@/queries/supplier-sync";
import { LOCKABLE_FIELD_LABELS, isLockableField } from "@ecommerce/supplier-sync/locks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";
import toast from "react-hot-toast";
import { formatAmount, formatDateTime } from "./format";

interface Props {
  productId: string;
  lockedFields: string[];
  link: NonNullable<Awaited<ReturnType<typeof getProductSupplierLink>>>;
}

/** Shown on the product form for supplier-synced products: where it comes from and which fields we override. */
const SupplierProductPanel: React.FC<Props> = ({ productId, lockedFields, link }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const follow = (field: string) => {
    startTransition(async () => {
      const result = await followSupplierAction(productId, field);
      if (result.success) {
        toast.success("Supplier value restored");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const stock = link.inStock ? "in stock" : link.onBackorder ? "on order" : "out of stock";
  const locks = lockedFields.filter(isLockableField);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Synced from {link.supplier.name}
          {link.removedAt && <Badge variant="destructive">Removed by supplier</Badge>}
          {link.pendingChanges > 0 && (
            <Badge asChild variant="secondary">
              <Link href="/admin/supplier-sync">{link.pendingChanges} to review</Link>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Supplier price {formatAmount(link.priceAmount, link.currency)}, {stock}. Last seen{" "}
          {formatDateTime(link.lastSeenAt)}.{" "}
          {link.permalink && (
            <a href={link.permalink} target="_blank" rel="noreferrer" className="underline">
              View at supplier
            </a>
          )}
        </p>
        {locks.length === 0 ? (
          <p className="text-muted-foreground">
            Every field follows the supplier. Fields you edit here stop following it until you restore them.
          </p>
        ) : (
          <div className="space-y-2">
            <p>Our own values (the sync leaves these alone):</p>
            <ul className="space-y-1">
              {locks.map((field) => (
                <li key={field} className="flex items-center justify-between gap-4">
                  <span>{LOCKABLE_FIELD_LABELS[field]}</span>
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => follow(field)}>
                    Follow supplier again
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { SupplierProductPanel };
