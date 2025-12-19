/**
 * Subscription Query Hook
 *
 * Fetches and caches the current subscription status from Polar.
 * Uses the client-side API endpoint instead of server-side resolver.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import type { SubscriptionGateState } from "@/lib/polar/current-subscription";

async function fetchSubscriptionStatus(): Promise<SubscriptionGateState> {
  const response = await fetch("/api/billing/status", {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = `Unable to load subscription status (HTTP ${response.status})`;

    try {
      const payload = await response.json();
      if (payload?.error && typeof payload.error === "string") {
        errorMessage = payload.error;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

export function useSubscriptionQuery(
  options?: Omit<
    UseQueryOptions<SubscriptionGateState, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.subscription.status(),
    queryFn: fetchSubscriptionStatus,

    // Subscription status is fresh for 5 minutes
    staleTime: 5 * 60 * 1000,

    // Cache for 15 minutes
    gcTime: 15 * 60 * 1000,

    // Retry once on failure
    retry: 1,

    // Don't refetch on window focus
    refetchOnWindowFocus: false,

    ...options,
  });
}

/**
 * Hook to get subscription state with safe defaults
 */
export function useSubscription() {
  const { data } = useSubscriptionQuery();
  return data ?? null;
}

/**
 * Hook to check if subscription is active
 */
export function useIsSubscriptionActive() {
  const subscription = useSubscription();
  return subscription?.isActive ?? false;
}
