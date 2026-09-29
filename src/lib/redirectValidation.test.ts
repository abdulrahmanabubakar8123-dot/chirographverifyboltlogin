/**
 * Regression tests for the Widget Key "Redirect URL" client-side validation.
 *
 * These rules MIRROR the server, which stays authoritative:
 *   src/lib/api-routes.ts  -> resolveRedirectAllowlist()
 *   src/lib/widget-flow.ts -> canonicalRedirectTarget()
 *
 * The browser copy exists only to give immediate feedback; it must never be
 * more permissive than the server, or the user would still be rejected on
 * submit. The last test asserts that direction explicitly.
 */
import { describe, expect, it } from 'vitest';
import { validateWidgetRedirectUrl } from './redirectValidation';

const ORIGIN = 'https://chiro-widget-demo.lovable.app';
const ALLOWED = [ORIGIN];

describe('validateWidgetRedirectUrl', () => {
  it('treats an empty value as valid because the field is optional', () => {
    expect(validateWidgetRedirectUrl('', ALLOWED)).toBeNull();
    expect(validateWidgetRedirectUrl('   ', ALLOWED)).toBeNull();
  });

  it('accepts a valid https URL on an Allowed Origin', () => {
    expect(validateWidgetRedirectUrl(`${ORIGIN}/callback`, ALLOWED)).toBeNull();
    expect(validateWidgetRedirectUrl(`${ORIGIN}/verified`, ALLOWED)).toBeNull();
  });

  it('rejects a URL on an origin that is not Allowed', () => {
    const err = validateWidgetRedirectUrl('https://evil-not-allowed.example.com/callback', ALLOWED);
    expect(err).toBeTruthy();
    expect(err).toContain('Allowed Origins');
  });

  it('rejects a non-https scheme, matching the server', () => {
    expect(validateWidgetRedirectUrl(`http://${ORIGIN.slice(8)}/cb`, ALLOWED)).toBeTruthy();
    expect(validateWidgetRedirectUrl('javascript:alert(1)', ALLOWED)).toBeTruthy();
  });

  it('rejects credentials embedded in the URL', () => {
    expect(validateWidgetRedirectUrl(`https://user:pw@${ORIGIN.slice(8)}/cb`, ALLOWED)).toBeTruthy();
    expect(validateWidgetRedirectUrl(`https://user@${ORIGIN.slice(8)}/cb`, ALLOWED)).toBeTruthy();
  });

  it('rejects a wildcard hostname', () => {
    expect(validateWidgetRedirectUrl(`https://*.${ORIGIN.slice(8)}/cb`, ALLOWED)).toBeTruthy();
  });

  it('rejects unparseable input and absurd lengths', () => {
    expect(validateWidgetRedirectUrl('not a url', ALLOWED)).toBeTruthy();
    expect(validateWidgetRedirectUrl('//chiro-widget-demo.lovable.app/cb', ALLOWED)).toBeTruthy();
    expect(validateWidgetRedirectUrl(`https://${ORIGIN.slice(8)}/${'a'.repeat(2100)}`, ALLOWED)).toBeTruthy();
  });

  it('matches the server for a mixed allowlist', () => {
    const two = [ORIGIN, 'https://app.example.com'];
    expect(validateWidgetRedirectUrl('https://app.example.com/done', two)).toBeNull();
    expect(validateWidgetRedirectUrl('https://nope.example.com/done', two)).toBeTruthy();
  });

  it('is never more permissive than the server rule it mirrors', () => {
    // Anything the server accepts, the client must accept; the client may be
    // stricter (it can only reject earlier), never laxer.
    const serverAccepts = (raw: string, allowed: string[]) => {
      const c = raw.trim();
      if (!c) return true;
      let u: URL;
      try {
        u = new URL(c);
      } catch {
        return false;
      }
      if (u.protocol !== 'https:' || u.username || u.password || u.hostname.includes('*')) return false;
      if (c.length > 2048) return false;
      const canon = `${u.protocol}//${u.host}${u.pathname}`;
      return allowed.some((a) => {
        try {
          return new URL(a).origin === new URL(canon).origin;
        } catch {
          return false;
        }
      });
    };
    const cases = [
      '', '   ', `${ORIGIN}/cb`, `${ORIGIN}`, 'https://a.example.com/cb', 'https://u:p@a.example.com/cb',
      'http://a.example.com/cb', 'javascript:alert(1)', 'not a url', `https://*.a.example.com/cb`,
      `https://a.example.com/${'x'.repeat(2100)}`, '//a.example.com/cb', 'https://[::1]/cb',
    ];
    for (const c of cases) {
      const clientOk = validateWidgetRedirectUrl(c, ['https://a.example.com']) === null;
      const serverOk = serverAccepts(c, ['https://a.example.com']);
      if (serverOk) expect(clientOk, `client rejected but server accepts: ${c.slice(0, 40)}`).toBe(true);
    }
  });
});
