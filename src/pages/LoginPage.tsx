import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSignIn, useAuth as useClerkAuth } from '@clerk/react';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/context/AuthContext';
import { resetCodeSentByEmail } from '@/lib/passwordReset';
import { markAuthIntent, trackAuthFailed } from '@/lib/analytics';
import Spinner from '@/components/Spinner';

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.475 2 2 6.475 2 12a9.994 9.994 0 0 0 6.838 9.488c.5.087.687-.213.687-.476c0-.237-.013-1.024-.013-1.862c-2.512.463-3.162-.612-3.362-1.175c-.113-.288-.6-1.175-1.025-1.413c-.35-.187-.85-.65-.013-.662c.788-.013 1.35.725 1.538 1.025c.9 1.512 2.338 1.087 2.912.825c.088-.65.35-1.087.638-1.337c-2.225-.25-4.55-1.113-4.55-4.938c0-1.088.387-1.987 1.025-2.688c-.1-.25-.45-1.275.1-2.65c0 0 .837-.262 2.75 1.026a9.28 9.28 0 0 1 2.5-.338c.85 0 1.7.112 2.5.337c1.912-1.3 2.75-1.024 2.75-1.024c.55 1.375.2 2.4.1 2.65c.637.7 1.025 1.587 1.025 2.687c0 3.838-2.337 4.688-4.562 4.938c.362.312.675.912.675 1.85c0 1.337-.013 2.412-.013 2.75c0 .262.188.574.688.474A10.016 10.016 0 0 0 22 12c0-5.525-4.475-10-10-10Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { signIn } = useSignIn();
  const { isLoaded: isClerkLoaded, isSignedIn } = useClerkAuth();
  const { signOutPhase, resetSignOutPhase } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/dashboard';

  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // If Clerk has loaded and confirms an active session, the user is already
  // authenticated. Send them straight to the dashboard instead of showing the
  // login form (which would otherwise surface Clerk's "already signed in" error).
  // Never redirect while Clerk auth state is still loading, and never do it
  // while a sign-out is finishing or complete.
  if (isClerkLoaded && isSignedIn && signOutPhase === 'idle') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const emailValue = email.trim();
    if (!emailValue || !emailValue.includes('@')) {
      setErrorMsg('Enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Enter your password.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const result = await signIn.password({
        identifier: emailValue,
        password,
      });
      if (result.error) {
        setErrorMsg(
          result.error.longMessage || result.error.message || 'Something went wrong. Please try again.',
        );
        trackAuthFailed({ stage: 'login', reason: 'clerk_rejected' });
      } else if (signIn.status === 'complete') {
        await signIn.finalize();
        markAuthIntent('login');
        // A fresh, explicit sign-in clears the terminal post-logout gate state
        // before we hand control back to the protected routes.
        resetSignOutPhase();
        navigate(from, { replace: true });
      } else {
        setErrorMsg(`Clerk sign-in is not complete. Status: ${signIn.status}`);
        trackAuthFailed({ stage: 'login', reason: 'incomplete' });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      trackAuthFailed({ stage: 'login', reason: 'unexpected_error' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 1 of Clerk's password-reset flow, kept inline so the obsidian card
   * never leaves the screen. Step 2 (code + new password) continues on the
   * existing /reset-password route, which shares this Clerk sign-in attempt.
   */
  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const emailValue = email.trim();
    if (!emailValue || !emailValue.includes('@')) {
      setErrorMsg('Enter the email address associated with your account.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const createResult = await signIn.create({ identifier: emailValue });
      if (createResult.error) {
        setErrorMsg(
          createResult.error.longMessage ||
            createResult.error.message ||
            'Something went wrong. Please try again.',
        );
        return;
      }
      const sendResult = await signIn.resetPasswordEmailCode.sendCode();
      if (sendResult.error) {
        setErrorMsg(
          sendResult.error.longMessage ||
            sendResult.error.message ||
            'Something went wrong. Please try again.',
        );
        return;
      }
      // Mark the address so /reset-password does not immediately send a second
      // code and invalidate the one we just mailed.
      resetCodeSentByEmail.add(emailValue);
      setResetSent(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
            {view === 'login' ? (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center">
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
                    Welcome back
                  </h1>
                  <p className="mt-2 text-sm text-zinc-400">
                    Sign in to your Chirograph Verify account
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} noValidate className="mt-8 space-y-5">
                  {/* Email Field */}
                  <div>
                    <label htmlFor="login-email" className="block text-xs font-medium text-zinc-300">
                      Email
                    </label>
                    <div className="glass-well mt-2 flex items-center gap-3 rounded-xl px-4 py-3 transition-all focus-within:border-[#3B5BFF]/65 focus-within:shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_0_0_3px_rgba(59,91,255,0.16)]">
                      <Mail className="h-4 w-4 shrink-0 text-zinc-500" />
                      <input
                        id="login-email"
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

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="login-password" className="block text-xs font-medium text-zinc-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setResetSent(false);
                          setView('forgot');
                        }}
                        className="text-xs text-zinc-400 transition-colors hover:text-emerald-400 cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="glass-well mt-2 flex items-center gap-3 rounded-xl px-4 py-3 transition-all focus-within:border-emerald-500/60 focus-within:shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_0_0_3px_rgba(16,185,129,0.14)]">
                      <Lock className="h-4 w-4 shrink-0 text-zinc-500" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="Enter your password"
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

                  {errorMsg && (
                    <p role="alert" className="text-xs text-rose-400">
                      {errorMsg}
                    </p>
                  )}

                  {/* Primary Sign In CTA */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black shadow-[0_0_28px_rgba(255,255,255,0.18)] transition-all duration-150 hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] cursor-pointer disabled:cursor-wait disabled:opacity-70"
                  >
                    {loading ? <Spinner size={16} /> : <span>Sign in</span>}
                  </button>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.08]" />
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                    <span>Or continue with</span>
                    <span className="morph-socket rounded-md px-1.5 py-0.5 text-[9px] text-zinc-400">
                      Soon
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-white/[0.08]" />
                </div>

                {/* Upcoming OAuth Providers */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="glass-panel-soft inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-300 opacity-70 cursor-not-allowed"
                  >
                    <GoogleIcon />
                    <span>Google</span>
                    <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                      Soon
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="glass-panel-soft inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-300 opacity-70 cursor-not-allowed"
                  >
                    <GitHubIcon />
                    <span>GitHub</span>
                    <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                      Soon
                    </span>
                  </button>
                </div>

                {/* Sign Up Prompt */}
                <p className="mt-7 text-center text-sm text-zinc-400">
                  Don&apos;t have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-white transition-colors hover:text-emerald-400"
                  >
                    Sign up
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="forgot-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setView('login');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to sign in</span>
                </button>

                <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-white">
                  Reset password
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Enter your account email and we&apos;ll send password recovery instructions.
                </p>

                {resetSent ? (
                  <div className="glass-well mt-6 rounded-xl border-emerald-500/30 p-4 text-sm text-zinc-300">
                    <div className="font-mono text-xs text-emerald-400">Request submitted</div>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                      If an account exists for <span className="text-white">{email}</span>, recovery instructions have been sent.
                    </p>
                    <Link
                      to={`/reset-password?email=${encodeURIComponent(email)}`}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-semibold text-black transition-all duration-150 hover:bg-emerald-400 cursor-pointer"
                    >
                      <span>Enter reset code</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleResetSubmit} noValidate className="mt-6 space-y-5">
                    <div>
                      <label htmlFor="reset-email" className="block text-xs font-medium text-zinc-300">
                        Email
                      </label>
                      <div className="glass-well mt-2 flex items-center gap-3 rounded-xl px-4 py-3 transition-all focus-within:border-[#3B5BFF]/65 focus-within:shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_0_0_3px_rgba(59,91,255,0.16)]">
                        <Mail className="h-4 w-4 shrink-0 text-zinc-500" />
                        <input
                          id="reset-email"
                          type="email"
                          autoComplete="email"
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

                    {errorMsg && (
                      <p role="alert" className="text-xs text-rose-400">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black shadow-[0_0_26px_rgba(255,255,255,0.18)] transition-all duration-150 hover:bg-emerald-400 cursor-pointer disabled:cursor-wait disabled:opacity-70"
                    >
                      {loading ? (
                        <Spinner size={16} />
                      ) : (
                        <>
                          <span>Send reset link</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AuthShell>
  );
}
