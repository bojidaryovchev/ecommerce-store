"use client";

import { type Category } from "@/actions/get-categories.action";
import EditCategoryModal from "@/components/edit-category-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, FolderTree, Image as ImageIcon, Package } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useState } from "react";

interface CategoriesListProps {
  categories: Category[];
}

const CategoriesList: React.FC<CategoriesListProps> = ({ categories }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };
  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FolderTree className="text-muted-foreground mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">No categories yet</h3>
          <p className="text-muted-foreground mt-2">Create your first category to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
            onClick={() => handleCategoryClick(category)}
          >
            {/* Category Image */}
            <div className="relative">
              {category.image ? (
                <div className="bg-muted relative aspect-video w-full overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="bg-muted flex aspect-video w-full items-center justify-center">
                  <ImageIcon className="text-muted-foreground h-12 w-12" />
                </div>
              )}

              {/* Edit Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="secondary" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Category
                </Button>
              </div>
            </div>

            <CardContent className="p-4">
              {/* Category Name */}
              <h3 className="text-lg font-semibold">{category.name}</h3>

              {/* Slug */}
              <p className="text-muted-foreground mt-1 font-mono text-sm">{category.slug}</p>

              {/* Description */}
              {category.description && (
                <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{category.description}</p>
              )}

              {/* Parent Category */}
              {category.parent && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <FolderTree className="h-4 w-4" />
                  <span className="text-muted-foreground">
                    Parent: <span className="font-medium">{category.parent.name}</span>
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4 border-t pt-3 text-sm">
                {/* Subcategories Count */}
                <div className="flex items-center gap-1.5">
                  <FolderTree className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">
                    {category._count?.children || 0} sub{category._count?.children === 1 ? "" : "s"}
                  </span>
                </div>

                {/* Products Count */}
                <div className="flex items-center gap-1.5">
                  <Package className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">
                    {category._count?.products || 0} product{category._count?.products === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="text-muted-foreground mt-3 text-xs">
                Created: {new Date(category.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      {selectedCategory && (
        <EditCategoryModal category={selectedCategory} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
      )}
    </>
  );
};

export default CategoriesList;
