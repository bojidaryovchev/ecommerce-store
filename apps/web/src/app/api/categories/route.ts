import { db, schema } from "@ecommerce/database";
import { asc, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await db.query.categories.findMany({
      where: isNull(schema.categories.parentId),
      orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
      with: {
        children: {
          orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
