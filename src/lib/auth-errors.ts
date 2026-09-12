export const authErrors = {
  access_denied:
    "Google sign-in was canceled. Please try again and allow sign-in to continue.",
  missing_code:
    "Google returned without a login code. Check the Google provider settings and the allowed callback URL in Supabase, then try again.",
  bad_code_verifier:
    "This login no longer matches this browser. Start again in this tab, using the same localhost address throughout.",
  flow_state_not_found:
    "This login attempt has expired or was already used. Start a new sign-in from this page.",
  flow_state_expired: "This login attempt has expired. Please start again.",
  pkce_code_verifier_not_found:
    "The login cookie is missing. Allow cookies and start again in this browser using the same site address throughout.",
  auth_service_unreachable:
    "The app cannot reach the sign-in service. Please try again shortly.",
  provider_disabled:
    "Google sign-in is not enabled for the connected Supabase project.",
  unexpected_failure:
    "Supabase could not complete Google sign-in. Check its Auth logs and the Google client ID and secret.",
  session_exchange_failed:
    "The app could not finish signing you in. Please try again; if it repeats, share the error reference below.",
};

export function authErrorReason(
  value: string | undefined | null,
): keyof typeof authErrors {
  return value && Object.hasOwn(authErrors, value)
    ? (value as keyof typeof authErrors)
    : "session_exchange_failed";
}
