import { NextResponse } from "next/server";

import { resolveCurrentSubscription } from "@/lib/polar/current-subscription";

export async function GET() {
  const state = await resolveCurrentSubscription();

  if (!state.isAuthenticated) {
    console.info("[Polar] /api/billing/status unauthenticated", {
      reason: state.reason,
    });
    return NextResponse.json(
      { error: state.reason ?? "Authentication required." },
      { status: 401 }
    );
  }

  if (state.reason === "INSUFFICIENT_PERMISSIONS") {
    console.info("[Polar] /api/billing/status forbidden", {
      reason: state.reason,
    });
    return NextResponse.json(
      { error: "You cannot view subscription details." },
      { status: 403 }
    );
  }

  console.info("[Polar] /api/billing/status", {
    isActive: state.isActive,
    status: state.status,
    reason: state.reason,
  });

  return NextResponse.json(state);
}
