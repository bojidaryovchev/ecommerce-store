import { db, schema } from "@ecommerce/database";
import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    const category = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, slug),
      with: {
        products: {
          where: eq(schema.products.active, true),
          with: {
            prices: {
              where: eq(schema.prices.active, true),
            },
          },
        },
        children: {
          orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
        },
        parent: true,
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}
