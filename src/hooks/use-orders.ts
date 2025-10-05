import { getOrders, type GetOrdersResult } from "@/actions/get-orders.action";
import type { OrderFilterData } from "@/schemas/order.schema";
import useSWR from "swr";

interface UseOrdersOptions {
  filters?: Partial<OrderFilterData>;
}

export function useOrders(options?: UseOrdersOptions) {
  const { data, error, isLoading, mutate } = useSWR<GetOrdersResult>(
    ["/api/orders", options?.filters],
    () => getOrders(options?.filters),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  return {
    orders: data?.orders ?? [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
