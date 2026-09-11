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
    <div className="flex min-h-screen flex-col bg-black">
      <header className="px-6 py-6">
        <Logo size="md" to="/" onDark />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="page-title sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-[#a1a4a5]">{subtitle}</p>}
          </div>
          <div className="card p-6 sm:p-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-[#a1a4a5]">{footer}</div>}
        </div>
      </main>
      <footer className="border-t border-[rgba(214,235,253,0.19)] px-6 py-4">
        <p className="text-center text-xs text-[#5c5c5c]">
          &copy; {new Date().getFullYear()} Chirograph Verify. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
