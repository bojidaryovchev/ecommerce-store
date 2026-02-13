"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDisclosure } from "@/hooks/use-disclosure";
import { deleteCategory } from "@/mutations/categories";
import type { Category } from "@ecommerce/database/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  categories: Category[];
}

const CategoriesTable: React.FC<Props> = ({ categories }) => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    onOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;

    setIsDeleting(true);
    try {
      const result = await deleteCategory(selectedCategory.id);

      if (result.success) {
        toast.success("Category deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
      onClose();
      setSelectedCategory(null);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="border-border rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground mb-4">No categories found</p>
        <Button asChild>
          <Link href="/admin/categories/new">Create your first category</Link>
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NAME</TableHead>
            <TableHead>SLUG</TableHead>
            <TableHead>PARENT</TableHead>
            <TableHead>ORDER</TableHead>
            <TableHead>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => {
            const parent = categories.find((c) => c.id === category.parentId);

            return (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{category.name}</span>
                    {category.description && (
                      <span className="text-muted-foreground max-w-xs truncate text-sm">{category.description}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{category.slug}</Badge>
                </TableCell>
                <TableCell>
                  {parent ? (
                    <Badge variant="outline">{parent.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{category.sortOrder}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/categories/${category.id}`}>Edit</Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/categories/${category.slug}`} target="_blank">
                            View
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(category)}
                        >
                          Delete
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedCategory?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export { CategoriesTable };
