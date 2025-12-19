import { redirect } from "next/navigation";
import { cookies } from "next/headers";

interface DashboardPageProps {
  searchParams: Promise<{ checkout_id?: string }>;
}

async function verifyPayment(sessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/billing/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error("[Dashboard] Payment verification failed", {
        status: response.status,
        error: data.error,
      });
      return { success: false, error: data.error ?? "Verification failed" };
    }

    const data = await response.json();
    console.info("[Dashboard] Payment verified successfully", {
      sessionId,
      hasActiveSubscription: data.has_active_subscription,
    });

    return { success: true };
  } catch (error) {
    console.error("[Dashboard] Payment verification error", error);
    return { success: false, error: "Network error during verification" };
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const checkoutId = params.checkout_id;

  if (checkoutId) {
    const result = await verifyPayment(checkoutId);

    if (result.success) {
      redirect("/dashboard/settings?view=subscription&payment_verified=true");
    } else {
      redirect(`/dashboard/settings?view=subscription&payment_error=true`);
    }
  }

  redirect("/dashboard/settings");
}
