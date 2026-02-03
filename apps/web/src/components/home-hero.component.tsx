import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const HomeHero: React.FC = () => {
  return (
    <section className="space-y-6 py-16 text-center">
      <h1 className="text-5xl font-bold">Welcome to Our Store</h1>
      <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
        Discover our curated collection of products across various categories.
      </p>
      <div className="flex justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/categories">Browse Categories</Link>
        </Button>
      </div>
    </section>
  );
};

export default HomeHero;
