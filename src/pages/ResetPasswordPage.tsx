import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
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

  // create() + resetPasswordEmailCode.sendCode() must run ONLY ONCE per
  // sign-in attempt. Running them again on every submit would mail a brand-new
  // reset code, invalidating the code the user had just typed — the infinite
  // "Invalid code" / "a new code was sent" loop reported by users. Confirmed
  // against the installed @clerk/shared types (signInFuture.d.ts):
  //   sendCode() -> emails a reset code
  //   verifyCode({ code }) -> verifies it; signIn.status -> 'needs_new_password'
  //   submitPassword({ password, signOutOfOtherSessions }) -> sets the new
  //       password; signIn.status -> 'complete'
  const [codeSent, setCodeSent] = useState(false);
  const attemptStartedRef = useRef(false);

  const requestCode = useCallback(
    async (identifier: string) => {
      if (!identifier) return false;
      setError('');
      setLoading(true);
      try {
        const createResult = await signIn.create({ identifier });
        if (createResult.error) {
          setError(createResult.error.longMessage || createResult.error.message || 'Something went wrong. Please try again.');
          return false;
        }
        const sendResult = await signIn.resetPasswordEmailCode.sendCode();
        if (sendResult.error) {
          setError(sendResult.error.longMessage || sendResult.error.message || 'Something went wrong. Please try again.');
          return false;
        }
        setCodeSent(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [signIn],
  );

  // Deep-link / bookmark support: send exactly one code when the page mounts
  // with an email, before the user has typed anything.
  useEffect(() => {
    if (prefillEmail && !attemptStartedRef.current) {
      attemptStartedRef.current = true;
      void requestCode(prefillEmail);
    }
  }, [prefillEmail, requestCode]);

  // Deliberate, separate action: request a new code for the currently entered
  // email. NOT triggered by the Verify submit.
  const handleResendCode = () => {
    setCode('');
    setCodeSent(false);
    void requestCode(email);
  };

  const handleEmailChange = (e: { target: { value: string } }) => {
    const val = e.target.value;
    // A different identifier invalidates any code already sent for another
    // address, so the user must request a fresh code before verifying.
    if (val !== email) {
      setEmail(val);
      setCode('');
      setCodeSent(false);
    }
  };

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
      // Verify ONLY. create() + sendCode() are run once in requestCode() — on
      // mount for deep links, or via the "Resend code" button — never here.
      // Re-sending on submit would mail a new code and invalidate the one
      // just typed (the infinite "Invalid code" loop).
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
              onChange={handleEmailChange}
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

        <div className="flex flex-col items-center gap-3">
          <button type="submit" disabled={loading || !code} className="btn-primary w-full">
            {loading ? <Spinner size={18} /> : 'Verify Code'}
          </button>
          {/* Deliberate, separate action: request another reset code for the
              currently-entered email. NOT a side effect of verifying. */}
          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading || !email}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {codeSent ? 'Resend code' : 'Send code'}
          </button>
          <p className="text-center text-xs text-slate-400">
            Next you'll choose a new password.
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
