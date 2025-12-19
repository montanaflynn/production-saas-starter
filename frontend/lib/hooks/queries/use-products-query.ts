import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import type { PolarProductResponse } from "@/app/api/billing/products/route";
import { queryKeys } from "./query-keys";

interface ProductsResponse {
  success: boolean;
  data: {
    products: PolarProductResponse[];
  };
  error?: string;
}

/**
 * Fetch products from Polar
 *
 * Returns all active products with pricing and metadata.
 * Products are cached for 5 minutes on the server.
 */
export function useProductsQuery(
  options?: Omit<
    UseQueryOptions<PolarProductResponse[], Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.products.list,
    queryFn: async (): Promise<PolarProductResponse[]> => {
      const response = await fetch("/api/billing/products");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ?? `Failed to fetch products (${response.status})`
        );
      }

      const data: ProductsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error ?? "Failed to fetch products");
      }

      return data.data.products;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (match server cache)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options,
  });
}
