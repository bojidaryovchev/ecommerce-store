"use client";

import { deleteCategory } from "@/actions/drizzle-categories.action";
import type { Category } from "@ecommerce/database/schema";
import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
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
      <div className="border-default-300 rounded-lg border border-dashed py-12 text-center">
        <p className="text-default-500 mb-4">No categories found</p>
        <Button as={Link} href="/admin/categories/new" color="primary">
          Create your first category
        </Button>
      </div>
    );
  }

  return (
    <>
      <Table aria-label="Categories table">
        <TableHeader>
          <TableColumn>NAME</TableColumn>
          <TableColumn>SLUG</TableColumn>
          <TableColumn>PARENT</TableColumn>
          <TableColumn>ORDER</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
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
                      <span className="text-default-400 max-w-xs truncate text-sm">{category.description}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat">
                    {category.slug}
                  </Chip>
                </TableCell>
                <TableCell>
                  {parent ? (
                    <Chip size="sm" variant="flat" color="secondary">
                      {parent.name}
                    </Chip>
                  ) : (
                    <span className="text-default-400">—</span>
                  )}
                </TableCell>
                <TableCell>{category.sortOrder}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Edit">
                      <Button as={Link} href={`/admin/categories/${category.id}`} size="sm" variant="light">
                        Edit
                      </Button>
                    </Tooltip>
                    <Tooltip content="View">
                      <Button as={Link} href={`/categories/${category.slug}`} size="sm" variant="light" target="_blank">
                        View
                      </Button>
                    </Tooltip>
                    <Tooltip content="Delete" color="danger">
                      <Button size="sm" variant="light" color="danger" onPress={() => handleDeleteClick(category)}>
                        Delete
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Delete Category</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete <strong>{selectedCategory?.name}</strong>? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose} isDisabled={isDeleting}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleConfirmDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CategoriesTable;
