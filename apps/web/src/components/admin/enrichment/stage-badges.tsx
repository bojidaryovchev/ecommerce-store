import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EnrichmentStage, EnrichmentStatus } from "@ecommerce/database/schema";
import React from "react";

const STAGE_LABELS: Record<EnrichmentStage, string> = {
  extract: "Extract",
  validate: "Validate",
  classify: "Classify",
  rewrite: "Rewrite",
  publish: "Publish",
};

const TONE: Record<EnrichmentStatus, string> = {
  succeeded: "border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  approved: "border-emerald-600/30 bg-emerald-600 text-white",
  pending: "border-sky-600/30 bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  flagged: "border-amber-600/40 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  failed: "border-red-600/30 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
  rejected: "border-border bg-muted text-muted-foreground",
};

/** One badge per pipeline stage: where a product stands, at a glance. */
const StageBadges: React.FC<{ stages: Partial<Record<EnrichmentStage, EnrichmentStatus>>; className?: string }> = ({
  stages,
  className,
}) => (
  <div className={cn("flex flex-wrap gap-1", className)}>
    {(Object.keys(STAGE_LABELS) as EnrichmentStage[]).map((stage) => {
      const status = stages[stage];
      return (
        <Badge
          key={stage}
          variant="outline"
          className={cn("font-normal", status ? TONE[status] : "text-muted-foreground border-dashed")}
          title={`${STAGE_LABELS[stage]}: ${status ?? "not run"}`}
        >
          {STAGE_LABELS[stage]}
          {status && status !== "succeeded" && status !== "approved" ? ` · ${status}` : ""}
        </Badge>
      );
    })}
  </div>
);

export { StageBadges };
