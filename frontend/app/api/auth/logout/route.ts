import { NextRequest, NextResponse } from "next/server";

import { getStytchB2BClient } from "@/lib/auth/stytch/server";
import { SESSION_COOKIE_NAME, SESSION_JWT_COOKIE_NAME } from "@/lib/auth/constants";

function resolveReturnTo(url: URL): string {
  const param = url.searchParams.get("returnTo");
  if (!param) return "/";
  const trimmed = param.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }
  return trimmed;
}

async function handle(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const redirectPath = resolveReturnTo(url);

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionJwt = request.cookies.get(SESSION_JWT_COOKIE_NAME)?.value;

  if (sessionToken || sessionJwt) {
    try {
      if (sessionToken) {
        await getStytchB2BClient().sessions.revoke({ session_token: sessionToken });
      } else if (sessionJwt) {
        await getStytchB2BClient().sessions.revoke({ session_jwt: sessionJwt });
      }
    } catch (error) {
      // Silently fail - user is logging out anyway
    }
  }

  const response = NextResponse.redirect(new URL(redirectPath, url.origin));
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete(SESSION_JWT_COOKIE_NAME);

  return response;
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
