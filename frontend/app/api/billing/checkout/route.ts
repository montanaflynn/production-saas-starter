import { NextResponse } from "next/server";

import { getMemberSession } from "@/lib/auth/stytch/server";
import { getServerPermissions } from "@/lib/auth/server-permissions";
import { getPolarClient } from "@/lib/polar/client";
import { getDefaultPlan, getPlanById, getPlanByProductId, type PolarPlan } from "@/lib/polar/plans";
import { getActiveSubscription } from "@/lib/polar/subscription";

function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_BASE_URL ??
    process.env.APP_BASE_URL ??
    "http://localhost:3000"
  );
}

export async function GET(request: Request) {
  const client = getPolarClient();
  if (!client || !process.env.POLAR_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "Polar billing is not configured." },
      { status: 503 }
    );
  }

  const session = await getMemberSession();
  if (!session?.session_jwt) {
    console.info("[Polar] Checkout attempted without authentication");
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const permissions = await getServerPermissions(session);
  const profile = permissions.profile;
  if (!profile) {
    console.warn("[Polar] Checkout aborted - profile unavailable");
    return NextResponse.json({ error: "Profile not available." }, { status: 401 });
  }

  if (!permissions.canManageSubscriptions) {
    console.info("[Polar] Checkout forbidden - insufficient permissions", {
      memberId: profile.member_id,
    });
    return NextResponse.json(
      { error: "You do not have access to manage subscriptions." },
      { status: 403 }
    );
  }

  try {
    // Fetch all products from Polar to validate the plan
    const productsResponse = await client.products.list({
      isArchived: false,
    });

    const polarProducts = productsResponse.result.items;

    // Transform products to PolarPlan format
    const availablePlans: PolarPlan[] = polarProducts
      .map((product): PolarPlan | null => {
        const price = product.prices?.[0];
        if (!price || !price.id) {
          console.warn("[Polar] Product missing price, skipping", {
            productId: product.id,
            name: product.name,
          });
          return null;
        }

        const metadata = (product.metadata ?? {}) as Record<string, unknown>;
        const planId = typeof metadata.plan_id === "string" ? metadata.plan_id : product.id;

        const includedSeats =
          typeof metadata.included_seats === "number"
            ? metadata.included_seats
            : typeof metadata.max_seats === "number"
              ? metadata.max_seats
              : typeof metadata.seats === "number"
                ? metadata.seats
                : null;

        const includedInvoices =
          typeof metadata.included_invoices === "number"
            ? metadata.included_invoices
            : typeof metadata.invoice_limit === "number"
              ? metadata.invoice_limit
              : typeof metadata.invoices === "number"
                ? metadata.invoices
                : null;

        const benefits =
          product.benefits?.map((b) => b.description).filter(Boolean) ?? [];

        const plan: PolarPlan = {
          id: planId,
          name: product.name,
          description: product.description ?? null,
          price:
            price.amountType === "fixed" && price.priceAmount
              ? price.priceAmount / 100
              : 0,
          interval: (price.recurringInterval as "month" | "year") ?? "month",
          productId: product.id,
          priceId: price.id,
          includedSeats,
          includedInvoices,
          benefits,
          metadata,
        };

        return plan;
      })
      .filter((plan): plan is PolarPlan => plan !== null);

    console.info("[Polar] Fetched products for checkout", {
      productsCount: availablePlans.length,
      productIds: availablePlans.map((p) => p.productId),
    });

    const url = new URL(request.url);
    const planId = url.searchParams.get("plan");
    const products = url.searchParams
      .getAll("products")
      .map((product) => product.trim())
      .filter(Boolean);

    let selectedPlan = getPlanById(availablePlans, planId);

    if (selectedPlan) {
      products.splice(0, products.length, selectedPlan.productId);
    }

    if (products.length === 0) {
      const defaultPlan = getDefaultPlan(availablePlans);
      if (defaultPlan) {
        selectedPlan = defaultPlan;
        products.push(defaultPlan.productId);
      } else {
        return NextResponse.json(
          { error: "No Polar product configured." },
          { status: 503 }
        );
      }
    }

    if (!selectedPlan && planId) {
      console.warn("[Polar] Requested plan not found, defaulting to product list", {
        planId,
      });
    }

    if (!selectedPlan && products.length > 0) {
      selectedPlan = getPlanByProductId(availablePlans, products[0]) ?? null;
    }

    const organizationId = profile.organization?.organization_id ?? null;

    // Check if user already has an active subscription
    // If they do, they should use the update endpoint instead
    const existingSubscription = await getActiveSubscription({
      externalCustomerId: organizationId,
      customerEmail: profile.email,
      organizationId,
    });

    if (existingSubscription.isActive && existingSubscription.subscription) {
      console.warn("[Polar] User already has active subscription, should use update endpoint", {
        subscriptionId: existingSubscription.subscription.id,
        currentProductId: existingSubscription.subscription.productId,
        requestedPlanId: selectedPlan?.id,
      });

      return NextResponse.json(
        {
          error: "You already have an active subscription.",
          shouldUpdate: true,
          subscriptionId: existingSubscription.subscription.id,
          currentProductId: existingSubscription.subscription.productId,
          message: "Please use the plan switcher to upgrade or downgrade your existing subscription.",
        },
        { status: 400 }
      );
    }
    const accountId =
      typeof profile.account_id === "number"
        ? String(profile.account_id)
        : profile.account_id ?? null;

    const metadata: Record<string, string> = {};
    if (organizationId) {
      metadata.organization_id = organizationId;
    }
    if (accountId) {
      metadata.account_id = accountId;
    }
    if (selectedPlan) {
      metadata.plan_id = selectedPlan.id;
    }

    const customerMetadata: Record<string, string> = {};
    if (organizationId) {
      customerMetadata.organization_id = organizationId;
    }

    console.info("[Polar] Creating checkout session", {
      organizationId,
      email: profile.email,
      products,
      planId: selectedPlan?.id ?? null,
    });

    const checkout = await client.checkouts.create({
      products,
      successUrl: `${getAppBaseUrl()}/dashboard?checkout_id={CHECKOUT_ID}`,
      returnUrl: `${getAppBaseUrl()}/subscribe-required`,
      externalCustomerId: organizationId ?? undefined,
      customerEmail: profile.email,
      customerName: profile.name ?? undefined,
      metadata: Object.keys(metadata).length ? metadata : undefined,
      customerMetadata: Object.keys(customerMetadata).length
        ? customerMetadata
        : undefined,
    });

    console.info("[Polar] Checkout session created", {
      checkoutId: checkout.id,
      url: checkout.url,
    });

    return NextResponse.redirect(checkout.url, { status: 303 });
  } catch (error) {
    console.error("[Polar] Failed to create checkout session", error);
    return NextResponse.json(
      { error: "Failed to start Polar checkout session." },
      { status: 500 }
    );
  }
}
