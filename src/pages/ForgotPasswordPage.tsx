import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import { useSignIn } from '@clerk/react';
import { ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';

export default function ForgotPasswordPage() {
  const { signIn } = useSignIn();
  const [searchParams] = useSearchParams();
  const prefill = searchParams.get('email') || '';

  const [email, setEmail] = useState(prefill);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    if (prefill) setEmail(prefill);
  }, [prefill]);

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
      // Step 1 of Clerk's forgot-password flow: create a sign-in attempt for
      // this identifier, then send the reset code to the user's email.
      // Verified against installed @clerk/shared SignInFutureResource types:
      // - create() takes SignInFutureCreateParams (identifier supported).
      // - emailCode.sendCode() is the available email-code sender on this
      //   resource; its send params (SignInFutureEmailCodeSendParams) accept
      //   emailAddress (optional — the create() identifier is reused when
      //   omitted). No strategy arg exists on either method here, so none is
      //   passed; the reset-password context comes from the sign-in attempt.
      const createResult = await signIn.create({ identifier: email });
      if (createResult.error) {
        setError(createResult.error.longMessage || createResult.error.message || 'Something went wrong. Please try again.');
        return;
      }
      const sendResult = await signIn.emailCode.sendCode({ emailAddress: email });
      if (sendResult.error) {
        setError(sendResult.error.longMessage || sendResult.error.message || 'Something went wrong. Please try again.');
        return;
      }
      // Step 2 (code + new password) happens on /reset-password.
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We sent a password reset code to your inbox"
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
            We've sent a 6-digit reset code to <strong>{email}</strong>. Enter it on the next page along with your new
            password.
          </p>
          <Link
            to={`/reset-password?email=${encodeURIComponent(email)}`}
            className="btn-primary mt-6 block w-full text-center"
          >
            Enter Code & Set New Password
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset code"
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
          {loading ? <Spinner size={18} /> : 'Send Reset Code'}
        </button>
      </form>
    </AuthLayout>
  );
}
