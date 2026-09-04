import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import { ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';
import { requestPasswordReset } from '@/lib/auth';
import { ApiError } from '@/lib/apiClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldError('');
    if (!email) {
      setFieldError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="If an account exists for that email, a reset link is on its way"
        footer={
          <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700">
            <ArrowLeft size={16} /> Back to sign in
          </Link>
        }
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={28} className="text-green-600" />
          </div>
          <p className="text-sm text-slate-600">
            We've sent password reset instructions to <strong>{email}</strong>. Follow the link in the email to reset your password.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
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
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? 'email-error' : undefined}
            />
          </div>
          {fieldError && <p id="email-error" className="mt-1.5 text-sm text-red-600">{fieldError}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner size={18} /> : 'Send Reset Link'}
        </button>
      </form>
    </AuthLayout>
  );
}
