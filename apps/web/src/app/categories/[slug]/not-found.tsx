"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import React from "react";

const NotFound: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="mb-4 text-4xl font-bold">Category Not Found</h1>
      <p className="text-default-600 mb-8">
        The category you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Button as={Link} href="/categories" color="primary" size="lg">
        Browse All Categories
      </Button>
    </main>
  );
};

export default NotFound;
