import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import { useSignIn } from '@clerk/react';
import { ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';

/**
 * Step 2 of Clerk's native forgot-password flow (in-app email code, NOT a
 * ?token= link). The emailed code is verified via the sign-in attempt's
 * emailCode.verifyCode({ code }), and on success Clerk signs the user in —
 * so this page navigates straight to the dashboard where they can set a new
 * password from their account settings.
 *
 * Verified against installed @clerk/shared SignInFutureResource types:
 * - signIn.emailCode.sendCode({ emailAddress }) to (re)send the code
 * - signIn.emailCode.verifyCode({ code }) — SignInFutureEmailCodeVerifyParams
 *   takes only { code }; the reset context comes from the sign-in attempt
 * plus the same finalize-then-navigate pattern as LoginPage. The strategy
 * string 'reset_password_email_code' is accepted as a SignInStrategy but is
 * NOT passed to create() here: the typed v6 create() on SignInFutureResource
 * starts a fresh attempt keyed off the identifier, which is all the emailCode
 * sender/verifier need.
 */
export default function ResetPasswordPage() {
  const { signIn } = useSignIn();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const prefillEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(prefillEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; code?: string }>({});

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  const validate = () => {
    const errs: typeof fieldErrors = {};
    // Email is required when arriving directly (deep link/bookmark) without
    // the reset already initiated on /forgot-password.
    if (!email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (!code.trim()) errs.code = 'Enter the 6-digit code from your email';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      // Start a fresh sign-in attempt for this identifier, then send the
      // reset code. The SignInFuture `status` field is typed narrowly here
      // (verified-only statuses are surfaced through `firstFactorVerification`
      // instead), so drive the flow off the attempt state below rather than
      // comparing `status` to unrelated literal values.
      const createResult = await signIn.create({ identifier: email });
      if (createResult.error) {
        setError(createResult.error.longMessage || createResult.error.message || 'Something went wrong. Please try again.');
        return;
      }
      // Arriving with a code already typed (e.g. after requesting on
      // /forgot-password) means the attempt exists but no code was sent in
      // THIS browser session — resending here is harmless and required.
      const sendResult = await signIn.emailCode.sendCode({ emailAddress: email });
      if (sendResult.error) {
        setError(sendResult.error.longMessage || sendResult.error.message || 'Something went wrong. Please try again.');
        return;
      }

      // Verify the emailed code via the reset-password email-code flow.
      // Per the installed @clerk/shared types, emailCode.verifyCode takes
      // only { code } (SignInFutureEmailCodeVerifyParams) — no strategy arg.
      // The reset context comes from the sign-in attempt created above.
      // firstFactorVerification.status surfaces verified/failed/expired
      // (verified-only statuses — see the SignInFutureVerifications type).
      const verifyResult = await signIn.emailCode.verifyCode({ code: code.trim() });
      if (verifyResult.error) {
        setError(verifyResult.error.longMessage || verifyResult.error.message || 'Invalid code. Please check the email and try again.');
        return;
      }

      if (signIn.firstFactorVerification.status === 'verified') {
        await signIn.finalize();
        navigate('/dashboard', { replace: true });
      } else {
        setError(`Code not verified. Status: ${signIn.firstFactorVerification.status}. Please try again or request a new code.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your reset code"
      subtitle="Enter the code from your email to sign back in"
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
          {loading ? <Spinner size={18} /> : 'Verify Code & Sign In'}
        </button>
        <p className="text-center text-xs text-slate-400">
          After signing in, you can set a new password from your account settings.
        </p>
      </form>
    </AuthLayout>
  );
}
