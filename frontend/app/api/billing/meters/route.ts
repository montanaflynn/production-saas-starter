import { NextResponse } from "next/server";

import { getMemberSession } from "@/lib/auth/stytch/server";
import { getServerPermissions } from "@/lib/auth/server-permissions";
import { listMeters, getCustomerMeterUsage } from "@/lib/polar/usage";
import { POLAR_METER_ID } from "@/lib/polar/config";

/**
 * Get Meters and Usage Data
 *
 * GET /api/billing/meters
 *
 * Returns:
 * - All available meters
 * - Customer usage for the configured invoice meter
 * - Current user's organization usage
 *
 * This endpoint provides secure access to Polar meters data without
 * exposing API keys to the frontend.
 */
export async function GET() {
  // Authentication check
  const session = await getMemberSession();
  if (!session?.session_jwt) {
    console.info("[Polar Meters] Unauthenticated request");
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const permissions = await getServerPermissions(session);
  if (!permissions.backendAvailable) {
    console.warn("[Polar Meters] Backend unavailable", {
      error: permissions.backendError,
    });
    return NextResponse.json(
      {
        error: "Service temporarily unavailable",
        details: permissions.backendError,
      },
      { status: 503 }
    );
  }

  const profile = permissions.profile;
  if (!profile) {
    console.warn("[Polar Meters] Profile unavailable");
    return NextResponse.json(
      { error: "Profile not available." },
      { status: 401 }
    );
  }

  if (!permissions.canManageSubscriptions) {
    console.info("[Polar Meters] Forbidden - insufficient permissions", {
      memberId: profile.member_id,
    });
    return NextResponse.json(
      { error: "You do not have access to manage subscriptions." },
      { status: 403 }
    );
  }

  try {
    // Fetch all meters
    const meters = await listMeters();

    // Find the invoice meter details
    const invoiceMeter = meters.find((m) => m.id === POLAR_METER_ID);

    console.info("[Polar Meters] Meters data fetched successfully", {
      totalMeters: meters.length,
      invoiceMeterId: POLAR_METER_ID,
      hasInvoiceMeter: Boolean(invoiceMeter),
      organizationId: profile.organization?.organization_id,
    });

    // NOTE: Customer usage API not yet available in SDK
    // When available, we can fetch per-customer usage here

    return NextResponse.json(
      {
        success: true,
        data: {
          // All available meters
          meters: meters.map((m) => ({
            id: m.id,
            name: m.name,
            aggregation: m.aggregation,
            filter: m.filter,
          })),

          // Invoice meter details
          invoiceMeter: invoiceMeter
            ? {
                id: invoiceMeter.id,
                name: invoiceMeter.name,
                aggregation: invoiceMeter.aggregation,
                filter: invoiceMeter.filter,
              }
            : null,

          // Placeholders for when SDK supports customer usage endpoint
          organizationUsage: null,
          customerUsage: null,
        },
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=60", // Cache for 1 minute
        },
      }
    );
  } catch (error) {
    console.error("[Polar Meters] Failed to fetch meters data", {
      error: error instanceof Error ? error.message : String(error),
      organizationId: profile.organization?.organization_id,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch meters data",
      },
      { status: 500 }
    );
  }
}
