import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/context/AuthContext';
import { ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';
import { ApiError } from '@/lib/apiClient';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const form = e.currentTarget as HTMLFormElement;
    const nameValue = (form.elements.namedItem('name') as HTMLInputElement).value;
    const emailValue = (form.elements.namedItem('email') as HTMLInputElement).value;
    const passwordValue = (form.elements.namedItem('password') as HTMLInputElement).value;
    const confirmValue = (form.elements.namedItem('confirm-password') as HTMLInputElement).value;
    setName(nameValue);
    setEmail(emailValue);
    setPassword(passwordValue);
    setConfirmPassword(confirmValue);
    const errs: typeof fieldErrors = {};
    if (!emailValue) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) errs.email = 'Enter a valid email address';
    if (!passwordValue) errs.password = 'Password is required';
    else if (passwordValue.length < 8) errs.password = 'Password must be at least 8 characters';
    if (passwordValue !== confirmValue) errs.confirm = 'Passwords do not match';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      await signup(emailValue, passwordValue, nameValue || undefined);
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent a verification link to your inbox"
        footer={
          <>
            Already verified?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </>
        }
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <Mail size={28} className="text-brand-600" />
          </div>
          <p className="text-sm text-slate-600">
            Click the link in the email to verify your account, then sign in to continue.
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary mt-6 w-full">
            Continue to Sign In
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start verifying devices with Chirograph Verify"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <div>
          <label htmlFor="name" className="label-text">Full name <span className="text-slate-400">(optional)</span></label>
          <div className="relative">
            <User size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field pl-10"
              placeholder="Jane Doe"
            />
          </div>
        </div>

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
          {fieldErrors.email && <p id="email-error" className="mt-1.5 text-sm text-red-600">{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="label-text">Password</label>
          <div className="relative">
            <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10 pr-10"
              placeholder="At least 8 characters"
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
          {fieldErrors.password && <p id="password-error" className="mt-1.5 text-sm text-red-600">{fieldErrors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirm-password" className="label-text">Confirm password</label>
          <div className="relative">
            <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field pl-10"
              placeholder="Re-enter your password"
              aria-invalid={!!fieldErrors.confirm}
              aria-describedby={fieldErrors.confirm ? 'confirm-error' : undefined}
            />
          </div>
          {fieldErrors.confirm && <p id="confirm-error" className="mt-1.5 text-sm text-red-600">{fieldErrors.confirm}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner size={18} /> : 'Create Account'}
        </button>
        <p className="text-center text-xs text-slate-400">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  );
}
