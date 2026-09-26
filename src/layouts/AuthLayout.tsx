import type { ReactNode } from 'react';
import { Fingerprint } from 'lucide-react';
import Logo from '@/components/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}

export default function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="px-6 py-6 lg:px-12">
        <Logo size="md" to="/" />
      </header>
      {/* Spec: two-panel — form column left-of-centre, oversized brand mark right */}
      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="flex w-full max-w-5xl items-center justify-center gap-16">
          <div className="w-full max-w-[400px]">
            <h1 className="text-headline-lg font-normal text-primary">{title}</h1>
            {subtitle && <p className="mt-2 text-body-md text-secondary">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
          </div>
          {/* Oversized brand mark — dramatic, unadorned, per spec */}
          <div className="hidden lg:block" aria-hidden="true">
            <div className="flex h-56 w-56 items-center justify-center rounded-full bg-primary shadow-glow">
              <Fingerprint size={120} strokeWidth={1.5} className="text-canvas" />
            </div>
          </div>
        </div>
      </main>
      <footer className="px-6 py-6 lg:px-12">
        <p className="text-label-md text-muted">
          &copy; {new Date().getFullYear()} Chirograph Verify. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
