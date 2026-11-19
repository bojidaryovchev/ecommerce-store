"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resetCategoryFaqAction, saveCategoryFaqAction } from "@/mutations/categories";
import { categoryFaqSchema, type CategoryFaqInput } from "@/schemas/category-faq.schema";
import type { CategoryFaqItem } from "@ecommerce/database/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";

export type CategoryFaqState = {
  items: CategoryFaqItem[];
  draft: CategoryFaqItem[] | null;
  status: "published" | "revise" | "held" | "failed" | null;
  source: "generated" | "admin" | null;
  notes: string | null;
};

type Props = { categoryId: string; faq: CategoryFaqState };

const BLANK = { question: "", answer: "" };

/**
 * The questions the category page shows under its products. Written by the pipeline and passed by its second
 * reader, or by the admin here: saved questions are the admin's, and the pipeline leaves them alone. A draft the
 * reader held, or gave up on, can be taken into the form, corrected and saved.
 */
const CategoryFaqForm: React.FC<Props> = ({ categoryId, faq }) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CategoryFaqInput>({
    resolver: zodResolver(categoryFaqSchema),
    defaultValues: { items: faq.items },
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: "items" });

  const onSubmit = async (input: CategoryFaqInput) => {
    const result = await saveCategoryFaqAction(categoryId, input);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(
      input.items.length > 0 ? "Saved. The page shows these questions now." : "Saved. The page shows no questions.",
    );
    router.refresh();
  };

  const giveBack = async () => {
    const result = await resetCategoryFaqAction(categoryId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("The next `enrich --faq` run writes them afresh; the second reader checks them.");
    router.refresh();
  };

  const status =
    faq.source === "admin"
      ? "Written by the admin: the pipeline leaves them alone."
      : faq.status === "published"
        ? "Written by the pipeline and passed by its second reader."
        : faq.status === "held"
          ? "The second reader held the last draft. Its notes are below."
          : faq.status === "failed"
            ? "Three drafts did not pass the second reader. Its last notes are below."
            : faq.status === "revise"
              ? "Sent back to the writer; the next run rewrites them."
              : "None yet: the next `enrich --faq` run writes them, for a category with enough products.";
  const waiting = faq.draft && (faq.status === "held" || faq.status === "failed") ? faq.draft : null;

  return (
    <div className="space-y-5">
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">{status}</p>
        {faq.notes && (faq.status === "held" || faq.status === "failed") && (
          <ul className="list-disc space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 pl-7 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {faq.notes.split("\n").map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
        {waiting && (
          <Button type="button" variant="outline" size="sm" onClick={() => replace(waiting)}>
            Take the draft into the form ({waiting.length} {waiting.length === 1 ? "question" : "questions"})
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <ol className="space-y-4">
          {fields.map((field, index) => (
            <li key={field.id} className="space-y-2 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`faq-question-${index}`}>Question {index + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  aria-label={`Remove question ${index + 1}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
              <Input
                id={`faq-question-${index}`}
                {...register(`items.${index}.question`)}
                aria-invalid={Boolean(errors.items?.[index]?.question)}
                disabled={isSubmitting}
              />
              {errors.items?.[index]?.question?.message && (
                <p className="text-destructive text-xs">{errors.items[index]!.question!.message}</p>
              )}
              <Textarea
                rows={4}
                aria-label={`Answer ${index + 1}`}
                {...register(`items.${index}.answer`)}
                aria-invalid={Boolean(errors.items?.[index]?.answer)}
                disabled={isSubmitting}
              />
              {errors.items?.[index]?.answer?.message && (
                <p className="text-destructive text-xs">{errors.items[index]!.answer!.message}</p>
              )}
            </li>
          ))}
        </ol>
        {errors.items?.root?.message && <p className="text-destructive text-sm">{errors.items.root.message}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => append(BLANK)}
            disabled={isSubmitting || fields.length >= 8}
          >
            <Plus className="size-4" aria-hidden />
            Add a question
          </Button>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Saving…" : "Save the questions"}
          </Button>
          {faq.status !== null && (
            <Button type="button" variant="ghost" onClick={giveBack} disabled={isSubmitting}>
              Let the pipeline write them again
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export { CategoryFaqForm };
