/**
 * Centralized Authentication Constants
 * Now supports both server and client contexts with proper separation
 */

// Static constants (safe for both contexts)
export const SESSION_COOKIE_NAME = "stytch_session";
export const SESSION_JWT_COOKIE_NAME = "stytch_session_jwt";
export const TOKEN_EXPIRY_GRACE_SECONDS = 60;

// Auth Routes (static, safe everywhere)
export const AUTH_ROUTES = {
  LOGIN: "/auth",
  LOGOUT: "/api/auth/logout",
  MAGIC_LINK: "/api/auth/magic-link",
  CONSUME_MAGIC_LINK: "/api/auth/consume-magic-link",
  SESSION_REFRESH: "/api/auth/session/refresh",
  AUTHENTICATE_REDIRECT: "/authenticate",
  DASHBOARD: "/dashboard",
} as const;



