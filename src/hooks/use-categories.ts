import { getCategories, type Category } from "@/actions/get-categories.action";
import useSWR from "swr";

/**
 * Hook to fetch all categories with SWR
 * Provides automatic caching, revalidation, and error handling
 */
export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<Category[]>("categories", async () => {
    const result = await getCategories();

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  });

  return {
    categories: data,
    isLoading,
    isError: error,
    mutate,
  };
}
