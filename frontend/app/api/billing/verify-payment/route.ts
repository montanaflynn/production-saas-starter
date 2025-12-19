import { NextResponse } from "next/server";

import { getMemberSession } from "@/lib/auth/stytch/server";
import { apiClient } from "@/lib/api/api/client/api-client";

interface VerifyPaymentRequest {
  session_id: string;
}

interface BillingStatus {
  organization_id: number;
  external_id?: string;
  has_active_subscription: boolean;
  can_process_invoices: boolean;
  invoice_count: number;
  reason: string;
  checked_at: string;
}

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session?.session_jwt) {
    console.info("[Billing] verify-payment attempted without authentication");
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  let body: VerifyPaymentRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (!body.session_id || typeof body.session_id !== "string") {
    return NextResponse.json(
      { error: "session_id is required." },
      { status: 400 }
    );
  }

  try {
    console.info("[Billing] Verifying payment from checkout session", {
      sessionId: body.session_id,
    });

    const billingStatus = await apiClient.post<BillingStatus>(
      "/subscriptions/verify-payment",
      { session_id: body.session_id }
    );

    console.info("[Billing] Payment verification successful", {
      sessionId: body.session_id,
      hasActiveSubscription: billingStatus.has_active_subscription,
      reason: billingStatus.reason,
    });

    return NextResponse.json(billingStatus);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Billing] Payment verification failed", {
      sessionId: body.session_id,
      error: errorMessage,
    });

    // Check if it's a 404 (session not found)
    if (errorMessage.includes("404")) {
      return NextResponse.json(
        { error: "Checkout session not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to verify payment." },
      { status: 500 }
    );
  }
}
