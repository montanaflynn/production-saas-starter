import "server-only";
import { SESSION_COOKIE_NAME, SESSION_JWT_COOKIE_NAME } from "./constants";

// Server-only: Read session duration from environment
export function getSessionDurationMinutes(): number {
  return (
    Number(process.env.NEXT_PUBLIC_STYTCH_SESSION_DURATION_MINUTES ?? "480") ||
    480
  );
}

// Server-only: Cookie config builder
export function getCookieConfig() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
  };
}

export function getSecureCookieConfig() {
  return {
    ...getCookieConfig(),
    httpOnly: true,
  };
}
