import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import React from "react";
import { CategoryFaqForm, type CategoryFaqState } from "./category-faq-form";

/** The category page's questions and answers, where they stand, and the form to change them. Read fresh: admin only. */
const CategoryFaqLoader: React.FC<{ categoryId: string }> = async ({ categoryId }) => {
  // At request time, never in a prerender: the pipeline changes this row outside the app.
  await connection();
  const row = await db.query.categoryFaqs.findFirst({ where: eq(schema.categoryFaqs.categoryId, categoryId) });
  const faq: CategoryFaqState = {
    items: row?.items ?? [],
    draft: row?.draft ?? null,
    status: row?.status ?? null,
    source: row?.source ?? null,
    notes: row?.notes ?? null,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Questions and answers</CardTitle>
        <CardDescription>
          Shown under the products on the Bulgarian page. Bulgarian, plain text; no prices, links or contact details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Keyed by what is saved, so the form starts again from it after a save. */}
        <CategoryFaqForm key={JSON.stringify(faq)} categoryId={categoryId} faq={faq} />
      </CardContent>
    </Card>
  );
};

export { CategoryFaqLoader };
