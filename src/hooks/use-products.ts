import { getProducts, type Product } from "@/actions/get-products.action";
import useSWR from "swr";

/**
 * Hook to fetch all products with SWR
 * Provides automatic caching, revalidation, and error handling
 */
export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR<Product[]>("products", async () => {
    const result = await getProducts();

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  });

  return {
    products: data,
    isLoading,
    isError: error,
    mutate,
  };
}
