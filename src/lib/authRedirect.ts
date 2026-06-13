// src/lib/authRedirect.ts
// Utility for handling the returnTo redirect flow after login/signup.
//
// In your Login.tsx / Signup.tsx page, after successful Supabase auth, call:
//   redirectAfterAuth(navigate);
//
// This reads ?returnTo= from the URL and sends the user back there,
// or falls back to the marketplace if no returnTo is set.

import type { NavigateFunction } from "react-router-dom";

/**
 * Call this immediately after a successful login or signup.
 * Reads the ?returnTo= query param and navigates the user there.
 */
export function redirectAfterAuth(navigate: NavigateFunction) {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo");

  // Safety: only allow relative paths (prevent open redirect)
  if (returnTo && returnTo.startsWith("/")) {
    navigate(returnTo, { replace: true });
  } else {
    navigate("/category/all", { replace: true });
  }
}

/**
 * Returns the ?returnTo= value from the current URL, or undefined.
 * Use this in Login/Signup to pre-fill messaging like
 * "Sign in to buy Charizard PSA 10".
 */
export function getReturnTo(): string | undefined {
  const params = new URLSearchParams(window.location.search);
  const r = params.get("returnTo");
  return r && r.startsWith("/") ? r : undefined;
}
