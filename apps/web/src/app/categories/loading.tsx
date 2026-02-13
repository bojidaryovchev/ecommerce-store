import { CategoriesGridSkeleton } from "@/components/common";

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-muted mb-8 h-8 w-48 animate-pulse rounded" />
      <CategoriesGridSkeleton count={8} />
    </main>
  );
}
