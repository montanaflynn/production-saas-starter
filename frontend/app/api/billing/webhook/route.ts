import { NextResponse } from "next/server";
import { Webhooks } from "@polar-sh/nextjs";

const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

async function handleSubscriptionEvent(eventType: string, payload: unknown) {
  try {
    console.info(`[Polar] ${eventType}`, {
      subscriptionId:
        typeof payload === "object" && payload && "id" in payload
          ? (payload as { id: string }).id
          : undefined,
    });
    // TODO: forward to backend persistence layer when available.
  } catch (error) {
    console.error("[Polar] Failed to handle webhook event", error);
  }
}

export const POST = webhookSecret
  ? Webhooks({
      webhookSecret,
      onSubscriptionCreated: async (subscription) => {
        await handleSubscriptionEvent("subscription.created", subscription);
      },
      onSubscriptionUpdated: async (subscription) => {
        await handleSubscriptionEvent("subscription.updated", subscription);
      },
      onSubscriptionCanceled: async (subscription) => {
        await handleSubscriptionEvent("subscription.canceled", subscription);
      },
      onOrderPaid: async (order) => {
        await handleSubscriptionEvent("order.paid", order);
      },
    })
  : async () =>
      NextResponse.json(
        { error: "Polar webhook secret not configured." },
        { status: 503 }
      );
