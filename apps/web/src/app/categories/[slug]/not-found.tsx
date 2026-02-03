import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const NotFound: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="mb-4 text-4xl font-bold">Category Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The category you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Button asChild size="lg">
        <Link href="/categories">Browse All Categories</Link>
      </Button>
    </main>
  );
};

export default NotFound;
