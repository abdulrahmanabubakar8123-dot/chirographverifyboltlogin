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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-canvas grid-bg">
      <header className="relative z-10 px-6 py-6">
        <Logo size="md" to="/" />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-text-secondary">{subtitle}</p>}
          </div>
          <div className="card border-white/[0.08] bg-surface/80 p-6 shadow-card backdrop-blur-sm sm:p-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-text-muted">{footer}</div>}
        </div>
      </main>
      <footer className="relative z-10 border-t border-line px-6 py-4">
        <p className="text-center text-xs text-text-muted">
          &copy; {new Date().getFullYear()} Chirograph Verify. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
