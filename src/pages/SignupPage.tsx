import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useSignUp, useAuth as useClerkAuth } from '@clerk/react';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/context/AuthContext';
import { MARKETING_URLS } from '@/lib/siteLinks';
import { markAuthIntent, trackAuthFailed } from '@/lib/analytics';
import Spinner from '@/components/Spinner';

export default function SignupPage() {
  const { signUp } = useSignUp();
  const { isLoaded: isClerkLoaded, isSignedIn } = useClerkAuth();
  const { signOutPhase, resetSignOutPhase } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  // If Clerk has loaded and confirms an active session, the user is already
  // authenticated. Send them straight to the dashboard instead of showing the
  // signup form (which would otherwise surface Clerk's "already signed in" error).
  // Never redirect while Clerk auth state is still loading, nor while a
  // sign-out is finishing/complete.
  if (isClerkLoaded && isSignedIn && signOutPhase === 'idle') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const nameValue = fullName.trim();
    const emailValue = email.trim();
    if (!emailValue || !emailValue.includes('@')) {
      setErrorMsg('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const result = await signUp.password({
        emailAddress: emailValue,
        password,
        ...(nameValue ? { firstName: nameValue } : {}),
      });
      if (result.error) {
        setErrorMsg(
          result.error.longMessage || result.error.message || 'Something went wrong. Please try again.',
        );
        trackAuthFailed({ stage: 'signup', reason: 'clerk_rejected' });
      } else {
        await signUp.verifications.sendEmailCode();
        setSuccess(true);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      trackAuthFailed({ stage: 'signup', reason: 'unexpected_error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    if (verifying) return;
    setVerifyError('');
    setResendMessage('');
    const code = verificationCode.trim();
    if (!code) {
      setVerifyError('Please enter the verification code we sent you.');
      return;
    }
    setVerifying(true);
    try {
      const result = await signUp.verifications.verifyEmailCode({ code });
      if (result.error) {
        setVerifyError(
          result.error.longMessage ||
            result.error.message ||
            'That verification code is invalid or has expired. Please try again or request a new code.',
        );
        trackAuthFailed({ stage: 'signup', reason: 'email_verification_failed' });
        return;
      }
      if (signUp.status === 'complete') {
        const finalizeResult = await signUp.finalize();
        if (finalizeResult.error) {
          setVerifyError(
            finalizeResult.error.longMessage ||
              finalizeResult.error.message ||
              'Something went wrong while finishing your account. Please try again.',
          );
          trackAuthFailed({ stage: 'signup', reason: 'finalize_failed' });
          return;
        }
        markAuthIntent('signup');
        resetSignOutPhase();
        navigate('/dashboard', { replace: true });
      } else {
        setVerifyError('Your email could not be verified. Please check the code or request a new one.');
        trackAuthFailed({ stage: 'signup', reason: 'email_verification_failed' });
      }
    } catch (err) {
      setVerifyError(
        err instanceof Error ? err.message : 'Something went wrong while verifying your code. Please try again.',
      );
      trackAuthFailed({ stage: 'signup', reason: 'unexpected_error' });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resending) return;
    setVerifyError('');
    setResendMessage('');
    setVerificationCode('');
    setResending(true);
    try {
      const result = await signUp.verifications.sendEmailCode();
      if (result.error) {
        setVerifyError(
          result.error.longMessage || result.error.message || 'We couldn\u2019t resend the code. Please try again.',
        );
      } else {
        setResendMessage('A new verification code has been sent to your email.');
      }
    } catch (err) {
      setVerifyError(
        err instanceof Error ? err.message : 'We couldn\u2019t resend the code. Please try again.',
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px]"
      >
        <div className="glass-panel rounded-2xl p-7 sm:p-9">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="verify-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center">
                  <div className="glass-well mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                    <Mail size={26} className="text-emerald-400" />
                  </div>
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
                    Check your email
                  </h1>
                  <p className="mt-2 text-sm text-zinc-400">
                    We&apos;ve sent a verification code to your inbox
                  </p>
                </div>

                <p className="mt-5 text-xs leading-relaxed text-zinc-400">
                  We&apos;ve sent a verification code to{' '}
                  <span className="text-white">{email}</span>. Enter it below to verify your
                  account and finish signing up.
                </p>

                <div className="mt-4 space-y-2">
                  {verifyError && (
                    <p role="alert" className="text-xs text-rose-400">
                      {verifyError}
                    </p>
                  )}
                  {resendMessage && <p className="text-xs text-emerald-400">{resendMessage}</p>}
                </div>

                <form onSubmit={handleVerifyCode} noValidate className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="verification-code" className="block text-xs font-medium text-zinc-300">
                      Verification code
                    </label>
                    <div className="glass-well mt-2 flex items-center gap-3 rounded-xl px-4 py-3 transition-all focus-within:border-emerald-500/60 focus-within:shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_0_0_3px_rgba(16,185,129,0.14)]">
                      <input
                        id="verification-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoFocus
                        value={verificationCode}
                        onChange={(e) =>
                          setVerificationCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))
                        }
                        placeholder="123456"
                        maxLength={6}
                        aria-label="Email verification code"
                        aria-invalid={!!verifyError}
                        className="w-full bg-transparent text-center text-sm tracking-[0.35em] text-white placeholder:text-zinc-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black shadow-[0_0_28px_rgba(255,255,255,0.18)] transition-all duration-150 hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] cursor-pointer disabled:cursor-wait disabled:opacity-70"
                  >
                    {verifying ? <Spinner size={16} /> : <span>Verify Email</span>}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="mt-4 w-full text-center text-sm font-semibold text-white transition-colors hover:text-emerald-400 disabled:opacity-60"
                >
                  {resending ? 'Resending…' : 'Resend code'}
                </button>

                <p className="mt-4 text-center text-xs text-zinc-500">
                  Didn&apos;t get a code? Check your spam folder.
                </p>

                <p className="mt-6 text-center text-sm text-zinc-400">
                  Already verified?{' '}
                  <Link to="/login" className="font-medium text-white transition-colors hover:text-emerald-400">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="signup-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center">
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
                    Create your account
                  </h1>
                  <p className="mt-2 text-sm text-zinc-400">
                    Start verifying devices with Chirograph Verify
                  </p>
                </div>

                <form onSubmit={handleSignupSubmit} noValidate className="mt-8 space-y-4">
                  {/* Full Name (optional) */}
                  <div>
                    <label htmlFor="signup-name" className="block text-xs font-medium text-zinc-300">
                      Full name <span className="text-zinc-500">(optional)</span>
                    </label>
                    <div className="glass-well mt-2 flex items-center gap-3 rounded-xl px-4 py-3 transition-all focus-within:border-[#3B5BFF]/65 focus-within:shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_0_0_3px_rgba(59,91,255,0.16)]">
                      <User className="h-4 w-4 shrink-0 text-zinc-500" />
                      <input
                        id="signup-name"
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="signup-email" className="block text-xs font-medium text-zinc-300">
                      Email
                    </label>
                    <div className="glass-well mt-2 flex items-center gap-3 rounded-xl px-4 py-3 transition-all focus-within:border-[#3B5BFF]/65 focus-within:shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_0_0_3px_rgba(59,91,255,0.16)]">
                      <Mail className="h-4 w-4 shrink-0 text-zinc-500" />
                      <input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="you@company.com"
                        className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="signup-password" className="block text-xs font-medium text-zinc-300">
                      Password
                    </label>
                    <div className="glass-well mt-2 flex items-center gap-3 rounded-xl px-4 py-3 transition-all focus-within:border-emerald-500/60 focus-within:shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_0_0_3px_rgba(16,185,129,0.14)]">
                      <Lock className="h-4 w-4 shrink-0 text-zinc-500" />
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="At least 8 characters"
                        className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="text-zinc-500 transition-colors hover:text-zinc-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="signup-confirm" className="block text-xs font-medium text-zinc-300">
                      Confirm password
                    </label>
                    <div className="glass-well mt-2 flex items-center gap-3 rounded-xl px-4 py-3 transition-all focus-within:border-emerald-500/60 focus-within:shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_0_0_3px_rgba(16,185,129,0.14)]">
                      <Lock className="h-4 w-4 shrink-0 text-zinc-500" />
                      <input
                        id="signup-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="Re-enter your password"
                        className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((prev) => !prev)}
                        aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                        className="text-zinc-500 transition-colors hover:text-zinc-200 cursor-pointer"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <p role="alert" className="text-xs text-rose-400">
                      {errorMsg}
                    </p>
                  )}

                  {/* Primary CTA */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black shadow-[0_0_28px_rgba(255,255,255,0.18)] transition-all duration-150 hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] cursor-pointer disabled:cursor-wait disabled:opacity-70"
                    >
                      {loading ? <Spinner size={16} /> : <span>Create Account</span>}
                    </button>
                  </div>
                </form>

                {/* Legal Notice */}
                <p className="mt-5 text-center text-xs leading-relaxed text-zinc-500">
                  By signing up, you agree to our{' '}
                  <a
                    href={MARKETING_URLS.terms}
                    className="text-zinc-300 transition-colors hover:text-white"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href={MARKETING_URLS.privacy}
                    className="text-zinc-300 transition-colors hover:text-white"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>

                {/* Sign In Prompt */}
                <p className="mt-6 text-center text-sm text-zinc-400">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-white transition-colors hover:text-emerald-400">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AuthShell>
  );
}
