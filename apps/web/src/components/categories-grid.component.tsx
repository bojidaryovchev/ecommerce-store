"use client";

import type { Category } from "@ecommerce/database/schema";
import { Card, CardBody, CardFooter } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  categories: Category[];
}

const CategoriesGrid: React.FC<Props> = ({ categories }) => {
  if (categories.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-default-500">No categories found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
};

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <Link href={`/categories/${category.slug}`}>
      <Card className="h-full cursor-pointer transition-transform hover:scale-105">
        <CardBody className="overflow-hidden p-0">
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              width={400}
              height={400}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="bg-default-100 flex aspect-square w-full items-center justify-center">
              <span className="text-default-400 text-4xl">{category.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </CardBody>
        <CardFooter className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-semibold">{category.name}</h3>
          {category.description && <p className="text-default-500 line-clamp-2 text-sm">{category.description}</p>}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default CategoriesGrid;
