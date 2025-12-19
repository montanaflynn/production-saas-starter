import { NextRequest, NextResponse } from "next/server";
import { getStytchB2BClient } from "@/lib/auth/stytch/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_JWT_COOKIE_NAME,
} from "@/lib/auth/constants";
import {
  getSessionDurationMinutes,
  getCookieConfig,
  getSecureCookieConfig,
} from "@/lib/auth/server-constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body?.token;
    const sessionDurationMinutes = body?.sessionDurationMinutes || getSessionDurationMinutes();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Magic link token is required." },
        { status: 400 }
      );
    }

    const client = getStytchB2BClient();

    const result = await client.magicLinks.authenticate({
      magic_links_token: token,
      session_duration_minutes: sessionDurationMinutes,
    });

    if (!result.member_authenticated) {
      return NextResponse.json(
        {
          success: true,
          memberAuthenticated: false,
          intermediateSessionToken: result.intermediate_session_token,
          member: result.member,
          organization: result.organization,
          mfaRequired: result.mfa_required,
          primaryRequired: result.primary_required,
        },
        { status: 200 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        memberAuthenticated: true,
        member: result.member,
        organization: result.organization,
      },
      { status: 200 }
    );

    const maxAgeSeconds = sessionDurationMinutes * 60;

    if (result.session_token) {
      response.cookies.set(SESSION_COOKIE_NAME, result.session_token, {
        ...getSecureCookieConfig(),
        maxAge: maxAgeSeconds,
      });
    }

    if (result.session_jwt) {
      response.cookies.set(SESSION_JWT_COOKIE_NAME, result.session_jwt, {
        ...getCookieConfig(),
        maxAge: maxAgeSeconds,
      });
    }

    return response;
  } catch (error: any) {
    const errorMessage = error?.error_message || error?.message || "Unable to verify magic link.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: error?.status_code || 500 }
    );
  }
}
