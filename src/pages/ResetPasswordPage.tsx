import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import { useSignIn } from '@clerk/react';
import { ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';

/**
 * Steps 2-3 of Clerk's native forgot-password flow (in-app email code, NOT a
 * ?token= link). Verified against the installed @clerk/shared
 * SignInFutureResource types (signInFuture.d.ts, @clerk/react 6.15.1):
 * - resetPasswordEmailCode.sendCode() — sends the reset code
 * - resetPasswordEmailCode.verifyCode({ code }) — verifies it; per the type
 *   docs, on success signIn.status becomes 'needs_new_password'
 * - resetPasswordEmailCode.submitPassword({ password, signOutOfOtherSessions })
 *   — sets the new password and moves signIn.status to 'complete'
 * then finalize() activates the session (same pattern as LoginPage).
 * The user therefore ends this flow signed in with their new password set.
 */
export default function ResetPasswordPage() {
  const { signIn } = useSignIn();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const prefillEmail = searchParams.get('email') || '';

  const [step, setStep] = useState<'code' | 'password'>('code');
  const [email, setEmail] = useState(prefillEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; code?: string; password?: string; confirm?: string }>({});

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const errs: typeof fieldErrors = {};
    if (!email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (!code.trim()) errs.code = 'Enter the 6-digit code from your email';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      // Start a fresh sign-in attempt for this identifier, then send the
      // reset code (resending here is harmless and covers arriving directly
      // via a deep link without having requested a code in this session).
      const createResult = await signIn.create({ identifier: email });
      if (createResult.error) {
        setError(createResult.error.longMessage || createResult.error.message || 'Something went wrong. Please try again.');
        return;
      }
      const sendResult = await signIn.resetPasswordEmailCode.sendCode();
      if (sendResult.error) {
        setError(sendResult.error.longMessage || sendResult.error.message || 'Something went wrong. Please try again.');
        return;
      }
      // Verify the emailed reset code. On success signIn.status becomes
      // 'needs_new_password' (per the resetPasswordEmailCode.verifyCode docs
      // on the installed type) and we advance to the password step.
      const verifyResult = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
      if (verifyResult.error) {
        setError(verifyResult.error.longMessage || verifyResult.error.message || 'Invalid code. Please check the email and try again.');
        return;
      }
      setStep('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const errs: typeof fieldErrors = {};
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errs.confirm = 'Passwords do not match';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      // Submit the new password. Per the installed types, this moves the
      // sign-in to status 'complete' (password now actually set on the
      // Clerk account).
      const submitResult = await signIn.resetPasswordEmailCode.submitPassword({
        password,
        signOutOfOtherSessions: true,
      });
      if (submitResult.error) {
        setError(submitResult.error.longMessage || submitResult.error.message || 'Could not set your new password. Please try again.');
        return;
      }
      if (signIn.status === 'complete') {
        await signIn.finalize();
        navigate('/dashboard', { replace: true });
      } else {
        setError(`Password reset is not complete. Status: ${signIn.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'password') {
    return (
      <AuthLayout
        title="Set a new password"
        subtitle="Your code was verified. Choose a new password."
        footer={
          <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700">
            <ArrowLeft size={16} /> Back to sign in
          </Link>
        }
      >
        <form onSubmit={handleSubmitPassword} noValidate className="space-y-5">
          {error && <ErrorBanner message={error} />}
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
            {fieldErrors.confirm && <p id="confirm-error" className="mt-1.5 text-sm text-red-600">{fieldErrors.confirm}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Spinner size={18} /> : 'Set New Password & Sign In'}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify your reset code"
      subtitle="Enter the code we emailed you, then set a new password"
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleVerifyCode} noValidate className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <div>
          <label htmlFor="email" className="label-text">Email</label>
          <div className="relative">
            <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
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
          <label htmlFor="code" className="label-text">Reset code</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input-field tracking-widest"
            placeholder="6-digit code"
            aria-invalid={!!fieldErrors.code}
            aria-describedby={fieldErrors.code ? 'code-error' : undefined}
          />
          {fieldErrors.code && <p id="code-error" className="mt-1.5 text-sm text-red-600">{fieldErrors.code}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner size={18} /> : 'Verify Code'}
        </button>
        <p className="text-center text-xs text-slate-400">
          Next you'll choose a new password.
        </p>
      </form>
    </AuthLayout>
  );
}
