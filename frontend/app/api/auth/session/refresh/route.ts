import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getStytchB2BClient } from "@/lib/auth/stytch/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_JWT_COOKIE_NAME,
} from "@/lib/auth/constants";
import {
  getSessionDurationMinutes,
  getCookieConfig,
} from "@/lib/auth/server-constants";
import { isTokenExpired } from "@/lib/auth/token-utils";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // First, check if we already have a valid JWT
    const existingJwt = cookieStore.get(SESSION_JWT_COOKIE_NAME)?.value ?? null;
    if (existingJwt && !isTokenExpired(existingJwt)) {
      console.log("[Refresh] Returning existing valid JWT");
      return NextResponse.json({ sessionJwt: existingJwt });
    }

    if (existingJwt) {
      console.log("[Refresh] Existing JWT is expired, fetching new one");
    }

    // Try to get session token to exchange for JWT
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;

    if (!sessionToken) {
      console.warn("[Refresh] No session token found in cookies");
      return NextResponse.json(
        { sessionJwt: null, error: "session_not_found" },
        { status: 401 }
      );
    }

    console.log("[Refresh] Exchanging session token for new JWT");

    const client = getStytchB2BClient();

    try {
      const response = await client.sessions.authenticate({
        session_token: sessionToken,
        session_duration_minutes: getSessionDurationMinutes(),
      });

      const sessionJwt = (response as any)?.session_jwt ?? null;

      if (!sessionJwt) {
        console.error("[Refresh] Stytch response missing session_jwt");
        return NextResponse.json(
          { sessionJwt: null, error: "session_missing_jwt" },
          { status: 401 }
        );
      }

      // Validate the new JWT before returning it
      if (isTokenExpired(sessionJwt)) {
        console.error("[Refresh] Newly issued JWT is already expired");
        return NextResponse.json(
          { sessionJwt: null, error: "session_jwt_expired" },
          { status: 401 }
        );
      }

      console.log("[Refresh] Successfully issued new JWT");

      const res = NextResponse.json({ sessionJwt });
      const maxAgeSeconds = getSessionDurationMinutes() * 60;

      res.cookies.set(SESSION_JWT_COOKIE_NAME, sessionJwt, {
        ...getCookieConfig(),
        maxAge: maxAgeSeconds,
      });

      return res;
    } catch (stytchError: any) {
      console.error("[Refresh] Stytch authentication failed:", stytchError?.message || "Unknown error");

      // Clear invalid session cookies
      const response = NextResponse.json(
        {
          sessionJwt: null,
          error: "session_invalid"
        },
        { status: 401 }
      );

      // Clear the invalid cookies
      response.cookies.delete(SESSION_COOKIE_NAME);
      response.cookies.delete(SESSION_JWT_COOKIE_NAME);

      return response;
    }
  } catch (error) {
    console.error("[Refresh] Unexpected error during token refresh:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { sessionJwt: null, error: "refresh_failed" },
      { status: 500 }
    );
  }
}
