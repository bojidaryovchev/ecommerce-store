import { useCategories } from "./use-categories";

/**
 * Hook to get categories formatted for select dropdowns
 * Optionally excludes specific category IDs (useful for preventing circular references)
 * @param excludeIds - Array of category IDs to exclude from the list (e.g., current category when editing)
 */
export function useCategoriesForSelect(excludeIds: string[] = []) {
  const { categories, isLoading, isError, mutate } = useCategories();

  const selectOptions = categories
    ?.filter((cat) => !excludeIds.includes(cat.id))
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
    }));

  return {
    categories: selectOptions,
    isLoading,
    isError,
    mutate,
  };
}
