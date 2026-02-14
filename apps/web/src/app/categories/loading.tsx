import { CategoriesGridSkeleton } from "@/components/common";

export default function Loading() {
  return (
    <main className="max-w-container py-8">
      <div className="bg-muted mb-8 h-8 w-48 animate-pulse rounded" />
      <CategoriesGridSkeleton count={8} />
    </main>
  );
}
