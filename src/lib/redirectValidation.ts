/**
 * Client-side mirror of the server's Widget Key redirect validation.
 *
 * THE SERVER REMAINS AUTHORITATIVE. This exists only to give the user instant
 * feedback before they press "Create Widget Key" — the dashboard previously
 * offered no client-side check at all, so an off-origin redirect was only
 * discovered after a server-side 400 (BUG-002).
 *
 * Mirrors, rule for rule:
 *   - src/lib/api-routes.ts    -> resolveRedirectAllowlist()
 *   - src/lib/widget-flow.ts   -> canonicalRedirectTarget()
 *
 * This copy must never be MORE PERMISSIVE than the server. `redirectValidation
 * .test.ts` pins that direction so the two cannot silently drift.
 *
 * If the server's rules change, change them here in the same commit.
 */

/** Mirrors the server's 2048-character ceiling on a supplied redirect. */
const MAX_REDIRECT_LENGTH = 2048;

/**
 * Mirrors the server's canonicalRedirectTarget(): scheme://host + pathname,
 * with query and fragment dropped.
 */
function canonicalRedirectTarget(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return null;
  }
}

/**
 * Validate the optional Redirect URL.
 *
 * @param raw     the current field value
 * @param allowedOrigins the tenant's saved Allowed Origins (exact origins)
 * @returns an error message to display, or null when the value is acceptable
 */
export function validateWidgetRedirectUrl(
  raw: string,
  allowedOrigins: string[],
): string | null {
  // Optional field: blank means "not supplied", exactly as the server treats it.
  const candidate = (raw ?? '').trim();
  if (candidate.length === 0) return null;
  if (candidate.length > MAX_REDIRECT_LENGTH) {
    return 'This URL is too long.';
  }

  let u: URL;
  try {
    u = new URL(candidate);
  } catch {
    return 'Enter a valid URL, for example https://your-app.example.com/callback';
  }

  // Same rejections as /settings/origins: https only, no userinfo, no wildcard.
  // canonicalRedirectTarget alone would accept userinfo and wildcards.
  if (u.protocol !== 'https:') {
    return 'The redirect URL must use https://';
  }
  if (u.username !== '' || u.password !== '') {
    return 'Remove the username and password from the URL.';
  }
  if (u.hostname.includes('*')) {
    return 'Wildcards are not allowed. Use a specific hostname.';
  }

  const canonical = canonicalRedirectTarget(candidate);
  if (canonical === null) {
    return 'Enter a valid URL, for example https://your-app.example.com/callback';
  }

  let originOfTarget: string;
  try {
    originOfTarget = new URL(canonical).origin;
  } catch {
    return 'Enter a valid URL, for example https://your-app.example.com/callback';
  }

  const owned = allowedOrigins.some((entry) => {
    try {
      return new URL(entry).origin === originOfTarget;
    } catch {
      return false;
    }
  });
  if (!owned) {
    return 'This URL must be on one of your Allowed Origins.';
  }

  return null;
}
