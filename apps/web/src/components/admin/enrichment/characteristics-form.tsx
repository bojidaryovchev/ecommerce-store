"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCharacteristicsAction } from "@/mutations/enrichment";
import { characteristicsSchema, type CharacteristicsInput } from "@/schemas/characteristics.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { ReviewData } from "./review-data";

type Props = { productId: string; characteristics: ReviewData["characteristics"] };

type Row = { key: string; name: string; unit: string | null; hint: string | null; group: string | null };

/**
 * What the product lacks, with a box for each: the characteristics nobody found (a group needs one value of
 * any of its fields), the contested ones, and the ones filled in before (to correct or clear). Saved values show
 * in the shop at once; the next enrichment run writes them into the copy and the reviewer checks it.
 */
const CharacteristicsForm: React.FC<Props> = ({ productId, characteristics }) => {
  const router = useRouter();
  const deltaT50 = (key: string) =>
    characteristics.outputAtDeltaT50 && key === "outputW" ? "At ΔT50 (75/65/20), as EN 442 rates it." : null;
  const rows: Row[] = [
    ...characteristics.missing.flatMap((gap) =>
      gap.fields.map((field) => ({
        ...field,
        hint: deltaT50(field.key),
        group: gap.fields.length > 1 ? `One of: ${gap.label}` : null,
      })),
    ),
    ...characteristics.contested.map((field) => ({
      ...field,
      hint: [
        field.supplier && `The supplier says ${field.supplier}`,
        field.found && `the research found ${field.found}`,
        deltaT50(field.key),
      ]
        .filter(Boolean)
        .join("; "),
      group: null,
    })),
    ...characteristics.filled.map((field) => ({
      ...field,
      hint: "Filled in on this page. Clear the box to remove it.",
      group: null,
    })),
  ];
  const filledValue = new Map(characteristics.filled.map((field) => [field.key, field.value]));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CharacteristicsInput>({
    resolver: zodResolver(characteristicsSchema),
    defaultValues: { values: rows.map((row) => ({ key: row.key, value: filledValue.get(row.key) ?? "" })) },
  });

  if (rows.length === 0) return null;

  const onSubmit = async (input: CharacteristicsInput) => {
    // Only what was typed in, plus the filled ones (an emptied box clears that value).
    const values = input.values.filter((entry) => entry.value.trim() !== "" || filledValue.has(entry.key));
    if (values.length === 0) {
      toast.error("Type in at least one value");
      return;
    }
    const result = await saveCharacteristicsAction(productId, { values });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.data.saved > 0
        ? "Saved. The next enrichment run writes it into the copy, then the reviewer checks it."
        : "Removed.",
    );
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <ul className="grid gap-4 sm:grid-cols-2">
        {rows.map((row, index) => (
          <li key={row.key} className="space-y-1.5">
            <input type="hidden" {...register(`values.${index}.key`)} />
            <Label htmlFor={`characteristic-${row.key}`}>
              {row.name}
              {row.unit && <span className="text-muted-foreground font-normal"> ({row.unit})</span>}
            </Label>
            <Input
              id={`characteristic-${row.key}`}
              inputMode="decimal"
              placeholder={row.unit ? `e.g. 12,5 ${row.unit}` : undefined}
              {...register(`values.${index}.value`)}
              aria-invalid={Boolean(errors.values?.[index]?.value)}
              disabled={isSubmitting}
            />
            {(row.group || row.hint) && (
              <p className="text-muted-foreground text-xs">{[row.group, row.hint].filter(Boolean).join(". ")}</p>
            )}
            {errors.values?.[index]?.value?.message && (
              <p className="text-destructive text-xs">{errors.values[index]!.value!.message}</p>
            )}
          </li>
        ))}
      </ul>
      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Saving…" : "Save the values"}
      </Button>
    </form>
  );
};

export { CharacteristicsForm };
