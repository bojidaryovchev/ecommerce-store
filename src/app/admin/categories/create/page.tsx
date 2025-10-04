import CreateCategoryForm from "@/components/create-category-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type React from "react";

const CreateCategoryPage: React.FC = () => {
  return (
    <div className="container mx-auto py-10">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Create New Category</CardTitle>
          <CardDescription>Add a new category to organize your products</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateCategoryForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCategoryPage;
