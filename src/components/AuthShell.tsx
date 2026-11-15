import { useLayoutEffect, type ReactNode } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { HeroNetworkParticles } from '@/components/HeroNetworkParticles';
import { MARKETING_URLS } from '@/lib/siteLinks';

/**
 * Obsidian glass shell shared by the auth screens.
 *
 * It owns the fixed #020305 canvas, the obsidian grid, the two morphing
 * ambient light blobs, the mouse-reactive particle network, the brand header
 * and the bottom-left legal footer. Pages only provide the centred card so the
 * background work (and its pointer listeners) runs exactly once per screen.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  // The console's persistent floating analytics pill also parks in the
  // bottom-left corner, where this shell renders its Privacy footer. Mark the
  // document while an auth screen is mounted so the pill steps aside instead
  // of stacking a second "Privacy" control on top of the design.
  useLayoutEffect(() => {
    document.body.classList.add('cv-auth-route');
    return () => {
      document.body.classList.remove('cv-auth-route');
    };
  }, []);

  return (
    <div className="cv-auth relative flex min-h-screen flex-col justify-between overflow-hidden bg-[#020305] text-zinc-100">
      {/* Subtle obsidian grid & refractive ambient light */}
      <div aria-hidden="true" className="bg-obsidian-grid pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden="true"
        className="animate-morph-a pointer-events-none absolute -top-24 left-[14%] h-[420px] w-[480px] bg-[#3B5BFF]/[0.18] blur-[125px]"
      />
      <div
        aria-hidden="true"
        className="animate-morph-b pointer-events-none absolute bottom-[8%] right-[12%] h-[380px] w-[440px] bg-emerald-500/[0.14] blur-[125px]"
      />

      {/* Lightweight mouse-reactive cryptographic network background */}
      <HeroNetworkParticles />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55"
      />

      {/* Top-Left Brand Header (matching verify.chirographverify.com/login) */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <a
          href={MARKETING_URLS.home}
          className="inline-flex items-center gap-2.5 text-[15px] tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
        >
          <BrandLogo className="h-7 w-7 shrink-0" />
          <span className="font-semibold text-white">
            Chirograph <span className="font-medium text-zinc-400">Verify</span>
          </span>
        </a>
      </header>

      {/* Center stage */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-8">
        {children}
      </main>

      {/* Bottom-Left Footer (matching verify.chirographverify.com/login) */}
      <footer className="relative z-10 flex flex-wrap items-center gap-4 px-6 py-5 text-xs text-zinc-500 sm:px-10">
        <a
          href={MARKETING_URLS.privacy}
          className="morph-socket rounded-lg px-3 py-1.5 text-zinc-300 transition-colors hover:text-white"
        >
          Privacy
        </a>
        <span>© 2026 Chirograph Verify. All rights reserved.</span>
      </footer>
    </div>
  );
}
