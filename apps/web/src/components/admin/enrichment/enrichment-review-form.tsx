"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { approveEnrichmentAction, rejectEnrichmentAction, rerunEnrichmentAction } from "@/mutations/enrichment";
import { enrichmentReviewSchema, type EnrichmentReviewInput } from "@/schemas/enrichment-review.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import type { ReviewData } from "./review-data";

const SOURCE_LABELS: Record<string, string> = {
  supplier_text: "supplier text",
  supplier_attribute: "supplier field",
  supplier_image: "supplier image",
  web: "web",
};

const KIND_TONE: Record<string, string> = {
  photo: "bg-emerald-600 text-white",
  icon: "bg-sky-600 text-white",
  badge: "bg-violet-600 text-white",
  energy_label: "bg-lime-600 text-white",
  spec_table: "bg-amber-600 text-white",
  diagram: "bg-slate-600 text-white",
  logo: "bg-slate-500 text-white",
  other: "bg-slate-400 text-white",
};

/** A labelled pair of "now" and "proposed", side by side on wide screens. */
const Compare: React.FC<{ label: string; now: React.ReactNode; children: React.ReactNode }> = ({
  label,
  now,
  children,
}) => (
  <div className="grid gap-3 lg:grid-cols-2">
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label} · now</p>
      <div className="bg-muted/40 text-muted-foreground min-h-10 rounded-md border px-3 py-2 text-sm whitespace-pre-line">
        {now ?? <span className="italic">none</span>}
      </div>
    </div>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const EnrichmentReviewForm: React.FC<{ data: ReviewData }> = ({ data }) => {
  const router = useRouter();
  const [isActing, startAction] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EnrichmentReviewInput>({
    resolver: zodResolver(enrichmentReviewSchema),
    defaultValues: {
      parts: { copy: data.proposal !== null, specs: data.specs.length > 0, category: data.category !== null },
      name: data.proposal?.name ?? "",
      metaDescription: data.proposal?.metaDescription ?? "",
      description: data.proposal?.description ?? "",
      specs: data.specs.map((spec) => ({ key: spec.key, name: spec.name, value: spec.value, include: true })),
    },
  });
  const { fields } = useFieldArray({ control, name: "specs" });
  const [meta, parts] = useWatch({ control, name: ["metaDescription", "parts"] });
  const busy = isSubmitting || isActing;

  const onSubmit = async (input: EnrichmentReviewInput) => {
    const result = await approveEnrichmentAction(data.productId, input);
    if (result.success) {
      toast.success("Published and locked against the sync");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const act = (action: "reject" | "rerun") => {
    startAction(async () => {
      const result =
        action === "reject"
          ? await rejectEnrichmentAction(data.productId)
          : await rerunEnrichmentAction(data.productId);
      if (result.success) {
        toast.success(
          action === "reject" ? "Proposal rejected" : "It will go through the pipeline again on the next run",
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {(data.problems.length > 0 || data.notices.length > 0 || data.note) && (
        <section className="space-y-3">
          {data.problems.length > 0 && (
            <div className="rounded-lg border border-amber-600/40 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
              <p className="font-semibold">Needs a decision</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {data.problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </div>
          )}
          {data.notices.length > 0 && (
            <div className="rounded-lg border p-4 text-sm">
              <p className="font-semibold">Notes from the checks</p>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
                {data.notices.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
              </ul>
            </div>
          )}
          {data.note && (
            <div className="rounded-lg border p-4 text-sm">
              <p className="font-semibold">Research</p>
              <p className="text-muted-foreground mt-1">{data.note}</p>
              {data.sources.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {data.sources.map((source) => (
                    <li key={source} className="truncate">
                      <a
                        href={source}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-xs hover:underline"
                      >
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Publish</h2>
        <div className="flex flex-wrap gap-6">
          {(
            [
              ["copy", "Name and description", data.proposal !== null],
              ["specs", `Specifications (${data.specs.length})`, data.specs.length > 0],
              ["category", "Category", data.category !== null],
            ] as const
          ).map(([part, label, available]) => (
            <Controller
              key={part}
              control={control}
              name={`parts.${part}`}
              render={({ field }) => (
                <label className={cn("flex items-center gap-2 text-sm", !available && "opacity-50")}>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    disabled={!available}
                  />
                  {label}
                </label>
              )}
            />
          ))}
        </div>
        {errors.parts && (
          <p className="text-destructive text-sm">{errors.parts.message ?? errors.parts.root?.message}</p>
        )}
      </section>

      {data.proposal ? (
        <section className={cn("space-y-6", !parts?.copy && "opacity-50")}>
          <h2 className="text-lg font-semibold">Name and description</h2>
          <Compare label="Name" now={data.current.name}>
            <Label htmlFor="name" className="text-xs uppercase">
              Name · proposed
            </Label>
            <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </Compare>
          <Compare label="Meta description" now={data.current.metaDescription}>
            <Label htmlFor="metaDescription" className="text-xs uppercase">
              Meta description · proposed{" "}
              <span className="text-muted-foreground">({meta?.length ?? 0} characters)</span>
            </Label>
            <Textarea
              id="metaDescription"
              rows={3}
              {...register("metaDescription")}
              aria-invalid={!!errors.metaDescription}
            />
            {errors.metaDescription && <p className="text-destructive text-sm">{errors.metaDescription.message}</p>}
          </Compare>
          <Compare label="Description" now={data.current.description}>
            <Label htmlFor="description" className="text-xs uppercase">
              Description · proposed
            </Label>
            <Textarea id="description" rows={18} {...register("description")} aria-invalid={!!errors.description} />
            {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
          </Compare>
        </section>
      ) : (
        <p className="text-muted-foreground text-sm">No rewritten copy yet.</p>
      )}

      {fields.length > 0 && (
        <section className={cn("space-y-3", !parts?.specs && "opacity-50")}>
          <h2 className="text-lg font-semibold">Specifications</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Publish</th>
                  <th className="px-3 py-2 font-medium">Field</th>
                  <th className="px-3 py-2 font-medium">Now</th>
                  <th className="px-3 py-2 font-medium">Proposed</th>
                  <th className="px-3 py-2 font-medium">From</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const spec = data.specs[index]!;
                  return (
                    <tr key={field.id} className="border-t align-top">
                      <td className="px-3 py-2">
                        <Controller
                          control={control}
                          name={`specs.${index}.include`}
                          render={({ field: include }) => (
                            <Checkbox
                              checked={include.value}
                              onCheckedChange={(checked) => include.onChange(checked === true)}
                              aria-label={`Publish ${spec.name}`}
                            />
                          )}
                        />
                      </td>
                      <td className="px-3 py-2">
                        {spec.name}
                        {spec.condition && (
                          <span className="text-muted-foreground block text-xs">{spec.condition}</span>
                        )}
                      </td>
                      <td className="text-muted-foreground px-3 py-2">
                        {spec.current ?? "–"}
                        {spec.conflict && (
                          <span
                            className={cn(
                              "mt-1 block text-xs",
                              spec.conflict.resolution === "review" ? "text-amber-700" : "text-emerald-700",
                            )}
                          >
                            {spec.conflict.resolution === "review" ? "conflicts" : "corrected (the name agrees)"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          {...register(`specs.${index}.value`)}
                          className="h-8 min-w-28"
                          aria-label={`${spec.name}, proposed`}
                          aria-invalid={!!errors.specs?.[index]?.value}
                        />
                      </td>
                      <td className="text-muted-foreground px-3 py-2 text-xs">
                        {spec.url ? (
                          <a href={spec.url} target="_blank" rel="noreferrer" className="hover:underline">
                            {SOURCE_LABELS[spec.source] ?? spec.source}
                          </a>
                        ) : (
                          (SOURCE_LABELS[spec.source] ?? spec.source)
                        )}
                        {` · ${spec.confidence}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.dropped.length > 0 && (
            <details className="text-sm">
              <summary className="text-muted-foreground cursor-pointer">
                Left out by the checks ({data.dropped.length})
              </summary>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
                {data.dropped.map((entry, index) => (
                  <li key={index}>
                    {entry.name}: {entry.value} ({entry.reason})
                  </li>
                ))}
              </ul>
            </details>
          )}
          {data.features.length > 0 && (
            <p className="text-muted-foreground text-sm">
              Features (shown in the buy box): {data.features.join(" · ")}
            </p>
          )}
        </section>
      )}

      {data.category && (
        <section className={cn("space-y-2", !parts?.category && "opacity-50")}>
          <h2 className="text-lg font-semibold">Category</h2>
          <p className="text-sm">
            <span className="text-muted-foreground">{data.current.category ?? "None"}</span> →{" "}
            <strong>{data.category.name}</strong>
          </p>
          <p className="text-muted-foreground text-sm">{data.category.reason}</p>
        </section>
      )}

      {data.images.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Images</h2>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {data.images.map((image) => (
              <li key={image.url} className="space-y-1">
                <a
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "bg-muted relative block aspect-square overflow-hidden rounded-md border",
                    image.otherModel && "opacity-40",
                  )}
                >
                  <Image
                    src={image.url}
                    alt={image.label ?? ""}
                    fill
                    unoptimized
                    sizes="120px"
                    className="object-contain"
                  />
                </a>
                <div className="flex flex-wrap gap-1">
                  <Badge className={cn("text-[10px]", image.kind ? KIND_TONE[image.kind] : "bg-muted text-foreground")}>
                    {image.kind?.replace("_", " ") ?? "unclassified"}
                  </Badge>
                  {image.otherModel && (
                    <Badge variant="outline" className="text-[10px]">
                      other model
                    </Badge>
                  )}
                </div>
                {image.label && <p className="text-muted-foreground line-clamp-2 text-xs">{image.label}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="bg-background/95 sticky bottom-0 flex flex-wrap gap-2 border-t py-4 backdrop-blur">
        <Button type="submit" disabled={busy || (!data.proposal && data.specs.length === 0 && !data.category)}>
          {isSubmitting ? "Publishing…" : "Approve and publish"}
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => act("reject")}>
          Reject
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => act("rerun")}>
          Run again
        </Button>
        {data.locked.length > 0 && (
          <p className="text-muted-foreground self-center text-xs">Locked now: {data.locked.join(", ")}</p>
        )}
      </div>
    </form>
  );
};

export { EnrichmentReviewForm };
