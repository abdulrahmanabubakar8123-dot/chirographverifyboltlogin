import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/context/AuthContext';
import { ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';
import { ApiError } from '@/lib/apiClient';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

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
      await login(emailValue, passwordValue);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Chirograph Verify account"
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <div>
          <label htmlFor="email" className="label-text">Email</label>
          <div className="relative">
            <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
            <p id="email-error" className="mt-1.5 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label-text">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="mt-1.5 text-sm text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner size={18} /> : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
}
