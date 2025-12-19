import { NextResponse } from "next/server";

import { resolveCurrentSubscription } from "@/lib/polar/current-subscription";

/**
 * Debug Endpoint - Full Polar Subscription Data
 *
 * GET /api/billing/debug
 *
 * Returns complete subscription state with all metadata for debugging.
 * This endpoint prints ALL Polar.sh subscription data including:
 * - Full subscription metadata
 * - Customer metadata
 * - Product metadata
 * - Meters array
 * - Trial information
 * - Custom fields
 *
 * IMPORTANT: Only use in development/testing. Do not expose in production.
 */
export async function GET() {
  // Security check - only allow in non-production environments
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error: "Debug endpoint disabled in production",
        message: "This endpoint is only available in development environments",
      },
      { status: 403 }
    );
  }

  try {
    const state = await resolveCurrentSubscription();

    // Return complete subscription state with all metadata
    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        data: {
          // Gate state
          isAuthenticated: state.isAuthenticated,
          isActive: state.isActive,
          reason: state.reason,
          status: state.status,
          backendAvailable: state.backendAvailable,
          backendError: state.backendError,

          // Subscription identifiers
          productId: state.productId,
          meterId: state.meterId,
          planId: state.planId,

          // Full subscription object with all metadata
          subscription: state.subscription,

          // Usage data
          usage: state.usage,

          // Metadata breakdown for easy inspection
          metadata: {
            subscription: state.subscription?.metadata ?? null,
            customFields: state.subscription?.customFieldData ?? null,
          },

          // Additional context
          trial: {
            start: state.subscription?.trialStart ?? null,
            end: state.subscription?.trialEnd ?? null,
            isActive:
              state.subscription?.trialStart &&
              state.subscription?.trialEnd &&
              new Date() < new Date(state.subscription.trialEnd),
          },

          cancellation: {
            cancelAtPeriodEnd: state.subscription?.cancelAtPeriodEnd ?? false,
            reason: state.subscription?.customerCancellationReason ?? null,
            comment: state.subscription?.customerCancellationComment ?? null,
          },

          recurringInterval: state.subscription?.recurringInterval ?? null,
        },
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[Polar Debug] Failed to fetch subscription data", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
