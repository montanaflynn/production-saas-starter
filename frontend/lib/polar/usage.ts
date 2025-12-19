import type { Subscription } from "@polar-sh/sdk/models/components/subscription";
import type { Meter } from "@polar-sh/sdk/models/components/meter";

import { getPolarClient } from "@/lib/polar/client";
import { POLAR_METER_ID } from "@/lib/polar/config";

export interface MeterUsageSummary {
  meterId: string;
  customerId: string;
  included: number;
  used: number;
  remaining: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Get invoice usage using Polar Meters Quantities API
 *
 * Finds the meter by name "invoice.processed" with count aggregation,
 * then fetches usage via meters.quantities() API.
 */
export async function getInvoiceUsage(
  subscription: Subscription
): Promise<MeterUsageSummary | null> {
  const client = getPolarClient();
  if (!client) {
    console.error("[Polar] Polar client unavailable, cannot fetch meter usage");
    return null;
  }

  try {
    const start = subscription.currentPeriodStart;
    const end = subscription.currentPeriodEnd ?? new Date();

    // Get external customer ID from subscription (note: it's 'externalId' in the SDK)
    const externalCustomerId = subscription.customer?.externalId ?? null;

    // 1. List all meters to find the invoice meter
    const meters = await listMeters();

    console.info("[Polar] All meters fetched - detailed inspection:");
    meters.forEach((m, index) => {
      console.info(`[Polar] Meter ${index + 1}:`, {
        id: m.id,
        name: m.name,
        organizationId: m.organizationId,
        archivedAt: m.archivedAt,
        filter: JSON.stringify(m.filter, null, 2),
        aggregation: JSON.stringify(m.aggregation, null, 2),
      });

      // Log filter details
      if (m.filter?.clauses) {
        console.info(`[Polar] Meter ${index + 1} filter clauses:`, {
          conjunction: m.filter.conjunction,
          clausesCount: m.filter.clauses.length,
          clauses: m.filter.clauses.map((c: any, i: number) => ({
            index: i,
            type: 'property' in c ? 'filterClause' : 'nestedFilter',
            data: JSON.stringify(c, null, 2),
          })),
        });
      }
    });

    // 2. Helper function to recursively search for matching filter clause
    const hasMatchingFilter = (clauses: any[]): boolean => {
      for (const clause of clauses) {
        // Check if this is a direct filter clause with property field
        if ('property' in clause) {
          const matches = (
            clause.property === "name" &&
            clause.value === "invoice.processed" &&
            (clause.operator === "eq" || clause.operator === "equals")
          );

          if (matches) {
            console.info("[Polar] Found matching clause:", {
              property: clause.property,
              operator: clause.operator,
              value: clause.value,
            });
            return true;
          }
        }

        // Check if this is a nested filter with its own clauses array
        if ('clauses' in clause && Array.isArray(clause.clauses)) {
          console.info("[Polar] Recursing into nested filter with", clause.clauses.length, "clauses");
          if (hasMatchingFilter(clause.clauses)) {
            return true;
          }
        }
      }
      return false;
    };

    // 3. Find meter that tracks "invoice.processed" events with count aggregation
    // The event name is in the filter clauses (potentially nested), not the meter name
    console.info("[Polar] Starting meter matching process...");

    const invoiceMeter = meters.find((m, index) => {
      console.info(`[Polar] Checking meter ${index + 1} (${m.id}):`, {
        name: m.name,
        aggregationFunc: m.aggregation?.func,
        hasFilter: Boolean(m.filter),
        hasClauses: Boolean(m.filter?.clauses),
        clausesLength: m.filter?.clauses?.length ?? 0,
        isArchived: Boolean(m.archivedAt),
      });

      // Skip archived meters - we only want active meters
      if (m.archivedAt) {
        console.info(`[Polar] Meter ${index + 1} - SKIPPED (archived at ${m.archivedAt})`);
        return false;
      }

      // Check if meter has count aggregation
      if (m.aggregation?.func !== "count") {
        console.info(`[Polar] Meter ${index + 1} - SKIPPED (aggregation is ${m.aggregation?.func}, not count)`);
        return false;
      }

      // Check if filter exists
      const filter = m.filter;
      if (!filter || !filter.clauses) {
        console.info(`[Polar] Meter ${index + 1} - SKIPPED (no filter or clauses)`);
        return false;
      }

      // Recursively search for matching filter clause
      const hasMatch = hasMatchingFilter(filter.clauses);

      if (hasMatch) {
        console.info(`[Polar] Meter ${index + 1} - SELECTED as invoice meter!`);
        return true;
      } else {
        console.info(`[Polar] Meter ${index + 1} - SKIPPED (no matching clause found)`);
        return false;
      }
    });

    // 4. Use only the found meter - no hardcoded fallbacks
    if (!invoiceMeter) {
      console.warn("[Polar] No active invoice meter found", {
        searchedFor: "active meter with: aggregation=count, filter property=name, value=invoice.processed",
        totalMetersChecked: meters.length,
        archivedMetersSkipped: meters.filter(m => m.archivedAt).length,
      });
      return null;
    }

    const meterId = invoiceMeter.id;

    console.info("[Polar] Fetching meter usage via quantities API", {
      meterId,
      meterName: invoiceMeter.name,
      meterAggregation: invoiceMeter.aggregation.func,
      meterFilter: JSON.stringify(invoiceMeter.filter),
      customerId: subscription.customerId,
      externalCustomerId,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    });

    // 5. Fetch quantities with customer filtering
    const response = await client.meters.quantities({
      id: meterId,
      startTimestamp: start,
      endTimestamp: end,
      interval: "month",
      customerId: subscription.customerId,
    });

    console.info("[Polar] Meter quantities response", {
      meterId,
      customerId: subscription.customerId,
      total: response.total,
      quantitiesCount: response.quantities?.length ?? 0,
    });

    // 5. Extract total usage and get included invoices from product metadata
    const used = response.total;

    // Get included invoices from product metadata
    const productMetadata = subscription.product?.metadata ?? {};
    const included =
      typeof productMetadata.included_invoices === "number"
        ? productMetadata.included_invoices
        : typeof productMetadata.invoice_limit === "number"
          ? productMetadata.invoice_limit
          : typeof productMetadata.invoices === "number"
            ? productMetadata.invoices
            : 1000; // Default fallback if not in metadata

    const remaining = Math.max(0, included - used);

    console.info("[Polar] Meter usage fetched successfully", {
      meterId,
      customerId: subscription.customerId,
      externalCustomerId,
      consumed: used,
      remaining,
      included,
      percentageUsed: included > 0 ? Math.round((used / included) * 100) : 0,
      productMetadata,
    });

    return {
      meterId,
      customerId: subscription.customerId,
      included,
      used,
      remaining,
      periodStart: start,
      periodEnd: end,
    };
  } catch (error) {
    console.error("[Polar] Failed to load meter usage", {
      error: error instanceof Error ? error.message : String(error),
      customerId: subscription.customerId,
    });
    return null;
  }
}

/**
 * List all available meters
 *
 * Returns all meters configured in Polar (e.g., "Invoice Processing")
 * Use this to discover available meters and their configurations.
 */
export async function listMeters(): Promise<Meter[]> {
  const client = getPolarClient();
  if (!client) {
    console.error("[Polar] Polar client unavailable, cannot list meters");
    return [];
  }

  try {
    console.info("[Polar] Fetching all meters");

    const response = await client.meters.list({});
    const meters = response.result.items;

    console.info("[Polar] Meters fetched successfully", {
      count: meters.length,
      meters: meters.map(m => ({
        id: m.id,
        name: m.name,
        aggregation: m.aggregation,
      })),
    });

    return meters;
  } catch (error) {
    console.error("[Polar] Failed to list meters", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Get customer usage for a specific meter
 *
 * NOTE: The SDK doesn't have a `customers()` endpoint yet.
 * This function is a placeholder for when that endpoint is available.
 * Currently returns null.
 */
export async function getCustomerMeterUsage(_meterId: string) {
  console.warn("[Polar] getCustomerMeterUsage not yet implemented - SDK lacks meters.customers() endpoint");
  return null;
}
