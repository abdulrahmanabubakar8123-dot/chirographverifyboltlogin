import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import { ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';
import { resetPassword } from '@/lib/auth';
import { ApiError } from '@/lib/apiClient';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errs.confirm = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword(token, password);
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Enter your new password below"
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <ErrorBanner message={error} />}
        {!token && (
          <ErrorBanner message="The reset link appears to be invalid. Please request a new one." />
        )}

        <div>
          <label htmlFor="password" className="label-text">New password</label>
          <div className="relative">
            <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoFocus
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
          <label htmlFor="confirm-password" className="label-text">Confirm new password</label>
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

        <button type="submit" disabled={loading || !token} className="btn-primary w-full">
          {loading ? <Spinner size={18} /> : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
