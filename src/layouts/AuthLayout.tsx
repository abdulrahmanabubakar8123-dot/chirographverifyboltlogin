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
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="px-6 py-6 lg:px-12">
        <Logo size="md" to="/" />
      </header>
      {/* Spec: single centered form column */}
      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="flex w-full max-w-5xl items-center justify-center gap-16">
          <div className="w-full max-w-[400px]">
            <h1 className="text-headline-lg font-normal text-primary">{title}</h1>
            {subtitle && <p className="mt-2 text-body-md text-secondary">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
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
