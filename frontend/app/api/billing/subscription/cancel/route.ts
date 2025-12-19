import { NextResponse } from "next/server";

import { getMemberSession } from "@/lib/auth/stytch/server";
import { getServerPermissions } from "@/lib/auth/server-permissions";
import { getActiveSubscription } from "@/lib/polar/subscription";
import { getPolarClient } from "@/lib/polar/client";
import type { SubscriptionCancel } from "@polar-sh/sdk/models/components/subscriptioncancel";
import type { CustomerCancellationReason } from "@polar-sh/sdk/models/components/customercancellationreason";

type CancelRequestPayload = {
  cancelAtPeriodEnd?: boolean;
  reason?: string | null;
  comment?: string | null;
};

const ALLOWED_REASONS = new Set([
  "too_expensive",
  "missing_features",
  "switched_service",
  "unused",
  "customer_service",
  "low_quality",
  "too_complex",
  "other",
]);

export async function POST(request: Request) {
  const client = getPolarClient();
  if (!client) {
    return NextResponse.json(
      { error: "Polar billing is not configured." },
      { status: 503 }
    );
  }

  const session = await getMemberSession();
  if (!session?.session_jwt) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const permissions = await getServerPermissions(session);
  const profile = permissions.profile;

  if (!profile?.organization?.organization_id) {
    return NextResponse.json(
      { error: "Organization context required to manage subscriptions." },
      { status: 400 }
    );
  }

  if (!permissions.canManageSubscriptions) {
    console.info("[Polar] Subscription cancel forbidden - insufficient permissions", {
      memberId: profile.member_id,
    });
    return NextResponse.json(
      { error: "You do not have access to manage subscriptions." },
      { status: 403 }
    );
  }

  let payload: CancelRequestPayload | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const cancelAtPeriodEnd =
    typeof payload?.cancelAtPeriodEnd === "boolean" ? payload.cancelAtPeriodEnd : true;

  const reason =
    typeof payload?.reason === "string" && ALLOWED_REASONS.has(payload.reason)
      ? payload.reason
      : undefined;
  const comment =
    typeof payload?.comment === "string" && payload.comment.trim().length > 0
      ? payload.comment.trim()
      : undefined;

  const subscriptionResult = await getActiveSubscription({
    externalCustomerId: profile.organization.organization_id,
    customerEmail: profile.email,
    organizationId: profile.organization.organization_id,
  });

  const subscription = subscriptionResult.subscription;

  if (!subscription) {
    return NextResponse.json(
      { error: "No active subscription to update." },
      { status: 400 }
    );
  }

  const subscriptionUpdatePayload: SubscriptionCancel = {
    cancelAtPeriodEnd,
  };

  if (reason) {
    subscriptionUpdatePayload.customerCancellationReason = reason as CustomerCancellationReason;
  }

  if (comment) {
    subscriptionUpdatePayload.customerCancellationComment = comment;
  }

  try {
    await client.subscriptions.update({
      id: subscription.id,
      subscriptionUpdate: subscriptionUpdatePayload,
    });
  } catch (error) {
    console.error("[Polar] Failed to update subscription cancellation", error);
    return NextResponse.json(
      { error: "Failed to update subscription status. Please try again." },
      { status: 500 }
    );
  }

  const refreshed = await getActiveSubscription({
    externalCustomerId: profile.organization.organization_id,
    customerEmail: profile.email,
    organizationId: profile.organization.organization_id,
  });

  return NextResponse.json({
    success: true,
    cancelAtPeriodEnd,
    status: refreshed.status,
    subscription: refreshed.subscription
      ? {
          id: refreshed.subscription.id,
          status: refreshed.subscription.status,
          cancelAtPeriodEnd: refreshed.subscription.cancelAtPeriodEnd,
          currentPeriodEnd: refreshed.subscription.currentPeriodEnd?.toISOString() ?? null,
        }
      : null,
  });
}
