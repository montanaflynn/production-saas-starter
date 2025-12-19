import { NextResponse } from "next/server";

import { getMemberSession } from "@/lib/auth/stytch/server";
import { getServerPermissions } from "@/lib/auth/server-permissions";
import { getPolarClient } from "@/lib/polar/client";

export interface PolarProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number; // USD per month
  interval: "month" | "year";
  productId: string;
  priceId: string | null;
  includedSeats: number | null;
  includedInvoices: number | null;
  benefits: string[];
  metadata: Record<string, unknown>;
}

/**
 * Get Products from Polar
 *
 * GET /api/billing/products
 *
 * Returns all active products from Polar with their pricing and metadata.
 * Products include plan details like included seats, invoices, and benefits.
 *
 * This endpoint provides secure access to Polar products without exposing API keys to the frontend.
 */
export async function GET() {
  // Authentication check
  const session = await getMemberSession();
  if (!session?.session_jwt) {
    console.info("[Polar Products] Unauthenticated request");
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const permissions = await getServerPermissions(session);
  if (!permissions.backendAvailable) {
    console.warn("[Polar Products] Backend unavailable", {
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
    console.warn("[Polar Products] Profile unavailable");
    return NextResponse.json(
      { error: "Profile not available." },
      { status: 401 }
    );
  }

  if (!permissions.canManageSubscriptions) {
    console.info("[Polar Products] Forbidden - insufficient permissions", {
      memberId: profile.member_id,
    });
    return NextResponse.json(
      { error: "You do not have access to manage subscriptions." },
      { status: 403 }
    );
  }

  const client = getPolarClient();
  if (!client) {
    console.warn("[Polar Products] Polar client unavailable");
    return NextResponse.json(
      { error: "Billing service not configured." },
      { status: 503 }
    );
  }

  try {
    console.info("[Polar Products] Fetching products");

    // Fetch all products from Polar
    const response = await client.products.list({
      // Only return active, non-archived products
      isArchived: false,
    });

    const products = response.result.items;

    console.info("[Polar Products] Products fetched successfully", {
      count: products.length,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        pricesCount: p.prices?.length ?? 0,
      })),
    });

    // Transform products to frontend-friendly format
    const transformedProducts: PolarProductResponse[] = products.reduce(
      (acc, product) => {
        const price = product.prices?.[0];
        if (!price || !price.id) {
          console.warn("[Polar Products] Product has no usable price", {
            productId: product.id,
            name: product.name,
          });
          return acc;
        }

        const metadata = product.metadata ?? {};

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

        const planId = typeof metadata.plan_id === "string" ? metadata.plan_id : product.id;

        acc.push({
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
          metadata: metadata as Record<string, unknown>,
        });

        return acc;
      },
      [] as PolarProductResponse[]
    ).sort((a, b) => a.price - b.price);

    return NextResponse.json(
      {
        success: true,
        data: {
          products: transformedProducts,
        },
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=300", // Cache for 5 minutes
        },
      }
    );
  } catch (error) {
    console.error("[Polar Products] Failed to fetch products", {
      error: error instanceof Error ? error.message : String(error),
      organizationId: profile.organization?.organization_id,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}
