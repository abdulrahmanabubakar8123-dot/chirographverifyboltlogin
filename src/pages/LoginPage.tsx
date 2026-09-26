import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useSignIn, useAuth } from '@clerk/react';
import { ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const { signIn } = useSignIn();
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // If Clerk has loaded and confirms an active session, the user is already
  // authenticated. Send them straight to the dashboard instead of showing the
  // login form (which would otherwise surface Clerk's "already signed in" error).
  // Never redirect while Clerk auth state is still loading.
  if (isClerkLoaded && isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const form = e.currentTarget as HTMLFormElement;
    const emailValue = (form.elements.namedItem('email') as HTMLInputElement).value;
    const passwordValue = (form.elements.namedItem('password') as HTMLInputElement).value;
    setEmail(emailValue);
    setPassword(passwordValue);
    const errs: { email?: string; password?: string } = {};
    if (!emailValue) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) errs.email = 'Enter a valid email address';
    if (!passwordValue) errs.password = 'Password is required';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const result = await signIn.password({
        identifier: emailValue,
        password: passwordValue,
      });
      if (result.error) {
        setError(result.error.longMessage || result.error.message || 'Something went wrong. Please try again.');
      } else if (signIn.status === 'complete') {
        await signIn.finalize();
        navigate(from, { replace: true });
      } else {
        setError(`Clerk sign-in is not complete. Status: ${signIn.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="px-6 py-6 lg:px-12">
        <Logo size="md" to="/" />
      </header>

      {/* Spec: two-panel — form column left-of-centre, oversized mark right */}
      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="flex w-full max-w-5xl items-center justify-center gap-16">
          <div className="w-full max-w-[400px]">
            <h1 className="text-headline-lg font-semibold text-primary">Welcome back</h1>
            <p className="mt-2 text-body-md text-secondary">
              Sign in to your Chirograph Verify account
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
              {error && <ErrorBanner message={error} />}

              <div>
                <label htmlFor="email" className="label-text">Email</label>
                <div className="relative">
                  <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="you@company.com"
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  />
                </div>
                {fieldErrors.email && (
                  <p id="email-error" className="mt-1.5 text-sm text-danger">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="label-text">Password</label>
                  <Link to="/forgot-password" className="text-xs font-medium text-brand-400 hover:text-brand-300">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="Enter your password"
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="password-error" className="mt-1.5 text-sm text-danger">{fieldErrors.password}</p>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Spinner size={16} /> : 'Sign in'}
              </button>

              <div className="flex items-center gap-3 pt-1">
                <div className="h-px flex-1 bg-line" />
                <span className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-micro text-muted">
                  Or continue with
                  <span className="pill-soon">Soon</span>
                </span>
                <div className="h-px flex-1 bg-line" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn-secondary cursor-not-allowed" disabled>
                  <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" /><path fill="currentColor" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" /></svg>
                  <span className="flex items-center gap-1">
                    <span>Google</span>
                    <span className="pill-soon">Soon</span>
                  </span>
                </button>
                <button type="button" className="btn-secondary cursor-not-allowed" disabled>
                  <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 0 0 8.84 21.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34a2.65 2.65 0 0 0-1.11-1.46c-.91-.62.07-.6.07-.6a2.1 2.1 0 0 1 1.53 1 2.15 2.15 0 0 0 2.91.83 2.16 2.16 0 0 1 .63-1.34c-2.22-.25-4.55-1.11-4.55-4.94a3.86 3.86 0 0 1 1-2.71 3.59 3.59 0 0 1 .1-2.64s.84-.27 2.75 1a9.63 9.63 0 0 1 5 0c1.91-1.29 2.75-1 2.75-1a3.59 3.59 0 0 1 .1 2.64 3.86 3.86 0 0 1 1 2.71c0 3.84-2.34 4.68-4.57 4.93a2.39 2.39 0 0 1 .69 1.85V21c0 .27.16.59.67.5A10 10 0 0 0 12 2" /></svg>
                  <span className="flex items-center gap-1">
                    <span>GitHub</span>
                    <span className="pill-soon">Soon</span>
                  </span>
                </button>
              </div>
            </form>

            <p className="mt-6 text-body-md text-muted">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:text-accent">
                Sign up
              </Link>
            </p>
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