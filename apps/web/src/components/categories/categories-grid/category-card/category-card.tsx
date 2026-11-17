import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { categoryTrail } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import { getCategoryIndex } from "@/queries/categories";
import type { Category } from "@ecommerce/database/schema";
import Image from "next/image";
import React from "react";

interface Props {
  category: Category;
}

const CategoryCard: React.FC<Props> = async ({ category }) => {
  const href = categoryHref(categoryTrail(await getCategoryIndex(), category.id));

  return (
    <Link href={href}>
      <Card className="h-full cursor-pointer transition-transform hover:scale-105">
        <CardContent className="overflow-hidden p-0">
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              width={400}
              height={400}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="bg-muted flex aspect-square w-full items-center justify-center">
              <span className="text-muted-foreground text-4xl">{category.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-semibold">{category.name}</h3>
          {category.description && <p className="text-muted-foreground line-clamp-2 text-sm">{category.description}</p>}
        </CardFooter>
      </Card>
    </Link>
  );
};

export { CategoryCard };
