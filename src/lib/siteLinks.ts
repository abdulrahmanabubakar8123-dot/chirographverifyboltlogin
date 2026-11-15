/**
 * Public marketing destinations.
 *
 * The legal pages and the brand home live on the marketing site, not on the
 * dashboard origin: verify.chirographverify.com only serves the console and
 * its auth routes. Linking to in-app paths such as /terms would hit the SPA
 * catch-all and bounce through /dashboard.
 */
export const MARKETING_URLS = {
  home: 'https://chirographverify.com/',
  terms: 'https://chirographverify.com/terms',
  privacy: 'https://chirographverify.com/privacy',
} as const;
