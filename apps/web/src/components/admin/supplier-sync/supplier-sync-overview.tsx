import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupplierSyncOverview } from "@/queries/supplier-sync";
import React from "react";
import { formatDateTime, formatDuration } from "./format";
import { SyncActions } from "./sync-actions";

const STATUS_VARIANT = {
  running: "secondary",
  succeeded: "outline",
  failed: "destructive",
  skipped: "secondary",
} as const;

const SupplierSyncOverview: React.FC = async () => {
  const { suppliers, pendingByType, runs } = await getSupplierSyncOverview();

  return (
    <div className="space-y-8">
      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-muted-foreground">
              No supplier has been synced yet. The first sync imports the whole catalog as drafts for review.
            </p>
            <SyncActions pendingNewProducts={0} />
          </CardContent>
        </Card>
      ) : (
        suppliers.map((supplier) => (
          <Card key={supplier.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {supplier.name}
                <a
                  href={supplier.baseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground text-sm font-normal hover:underline"
                >
                  {supplier.baseUrl.replace(/^https?:\/\//, "")}
                </a>
                {!supplier.active && <Badge variant="secondary">Paused</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground">Products tracked</dt>
                  <dd className="text-lg font-semibold">{supplier.products - supplier.removed}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Waiting for review</dt>
                  <dd className="text-lg font-semibold">
                    {Object.values(pendingByType).reduce((sum, n) => sum + (n ?? 0), 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last sync</dt>
                  <dd>{formatDateTime(supplier.lastSyncedAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last full refresh</dt>
                  <dd>{formatDateTime(supplier.lastFullSyncAt)}</dd>
                </div>
              </dl>
              <SyncActions pendingNewProducts={pendingByType.new_product ?? 0} />
            </CardContent>
          </Card>
        ))
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Recent runs</h2>
        {runs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No runs yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STARTED</TableHead>
                <TableHead>SUPPLIER</TableHead>
                <TableHead>TYPE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>DURATION</TableHead>
                <TableHead>RESULT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="text-sm">{formatDateTime(run.startedAt)}</TableCell>
                  <TableCell className="text-sm">{run.supplier.name}</TableCell>
                  <TableCell className="text-sm">
                    {run.mode === "full" ? "Full" : "Incremental"}
                    <span className="text-muted-foreground"> · {run.trigger}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[run.status]}>{run.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDuration(run.startedAt, run.finishedAt)}</TableCell>
                  <TableCell className="max-w-md text-sm">
                    {run.error ? (
                      <span className="text-destructive" title={run.error}>
                        {run.error}
                      </span>
                    ) : (
                      <span>
                        {run.stats.created} new · {run.stats.updated} updated · {run.stats.removed} removed ·{" "}
                        {run.stats.fetched}/{run.stats.seen} downloaded
                        {run.stats.failed > 0 && (
                          <span className="text-destructive" title={run.errors.map((e) => e.message).join("\n")}>
                            {" "}
                            · {run.stats.failed} failed
                          </span>
                        )}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
};

export { SupplierSyncOverview };
