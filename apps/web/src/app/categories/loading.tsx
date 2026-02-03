export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-muted mb-8 h-8 w-48 animate-pulse rounded" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-muted aspect-square animate-pulse rounded-lg" />
        ))}
      </div>
    </main>
  );
}
