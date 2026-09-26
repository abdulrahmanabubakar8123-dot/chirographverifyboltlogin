import type { ReactNode } from 'react';
import Logo from '@/components/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}

export default function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-canvas">
      {/* Faint technical grid */}
      <div className="grid-bg pointer-events-none absolute inset-0" />

      <header className="relative z-10 border-b border-line px-6 py-4">
        <Logo size="md" to="/" />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-lg font-semibold tracking-tight text-text-primary">{title}</h1>
            {subtitle && <p className="mt-1 text-sm leading-relaxed text-text-muted">{subtitle}</p>}
          </div>
          <div className="card p-7">{children}</div>
          {footer && <div className="mt-5 text-center text-sm text-text-muted">{footer}</div>}
        </div>
      </main>
      <footer className="relative z-10 border-t border-line px-6 py-4">
        <p className="text-center text-2xs text-text-micro">
          &copy; {new Date().getFullYear()} Chirograph Verify. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
