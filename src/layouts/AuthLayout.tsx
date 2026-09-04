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
    <div className="flex min-h-screen flex-col bg-white">
      <header className="px-6 py-6">
        <Logo size="md" to="/" />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <div className="card p-6 sm:p-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </main>
      <footer className="border-t border-slate-100 px-6 py-4">
        <p className="text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Chirograph Verify. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
