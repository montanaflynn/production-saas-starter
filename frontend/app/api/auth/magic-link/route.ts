import { NextRequest, NextResponse } from "next/server";
import {
  getStytchB2BClient,
  getOrganizationIdsForMemberSearch,
} from "@/lib/auth/stytch/server";

/**
 * POST /api/auth/magic-link
 *
 * Validates that an email belongs to an existing member before sending a magic link.
 * This prevents unknown users from receiving authentication emails.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    const client = getStytchB2BClient();
    const organizationIds = await getOrganizationIdsForMemberSearch();

    if (!organizationIds.length) {
      console.error("[Magic Link] No organization IDs configured for member search.");
      return NextResponse.json(
        {
          error: "Unable to process request. Please try again later.",
        },
        { status: 500 }
      );
    }

    // Search for members with this email across all organizations
    // This checks if the user exists in ANY organization
    const searchResult = await client.organizations.members.search({
      organization_ids: organizationIds,
      query: {
        operator: "AND",
        operands: [
          {
            filter_name: "member_emails",
            filter_value: [email.toLowerCase()],
          },
        ],
      },
    });

    // If no members found, reject without revealing this fact
    if (!searchResult.members || searchResult.members.length === 0) {
      // Return success to prevent user enumeration
      // But don't actually send an email
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, a magic link has been sent.",
      });
    }

    // Member exists - prepare login redirect URL
    const redirectUrl = process.env.NEXT_PUBLIC_APP_BASE_URL
      ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/authenticate`
      : `${request.nextUrl.origin}/authenticate`;

    const memberOrganizationIds = Array.from(
      new Set(
        (searchResult.members ?? [])
          .map((member) => member.organization_id)
          .filter((orgId): orgId is string => Boolean(orgId))
      )
    );

    if (memberOrganizationIds.length === 0) {
      console.warn(
        "[Magic Link] Member search succeeded but no organization IDs were returned for email:",
        email
      );
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, a magic link has been sent.",
      });
    }

    if (memberOrganizationIds.length > 1) {
      console.warn(
        "[Magic Link] Email is associated with multiple organizations; issuing login link for all memberships.",
        {
          email,
          organizationIds: memberOrganizationIds,
        }
      );
    }

    // Send magic link for each organization the member belongs to
    await Promise.all(
      memberOrganizationIds.map((organizationId) =>
        client.magicLinks.email.loginOrSignup({
          email_address: email,
          organization_id: organizationId,
          login_redirect_url: redirectUrl,
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a magic link has been sent.",
    });
  } catch (error: any) {
    console.error("[Magic Link] Error sending magic link:", error);

    // Return generic error to prevent user enumeration
    return NextResponse.json(
      {
        error: "Unable to process request. Please try again later.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
