'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { InteractiveLogo } from '@/components/design-system/InteractiveLogo';
import { MouseShine } from '@/components/design-system/MouseShine';

// Only accept a same-origin relative path (never "//host/..." or an absolute
// URL) - `next` comes from a query param on an otherwise-public URL, so
// treating it as trusted would be an open-redirect vulnerability.
function safeNext(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return '/dashboard';
}

type Mode = 'signin' | 'signup' | 'forgot';
type Status = 'idle' | 'submitting' | 'error';

const MIN_PASSWORD_LENGTH = 8;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3h3.89c2.27-2.09 3.56-5.17 3.56-8.82Z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.89-3c-1.08.73-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.27v3.1A12 12 0 0 0 12 24Z"
        fill="#34A853"
      />
      <path d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.27a12 12 0 0 0 0 10.8l4.02-3.1Z" fill="#FBBC05" />
      <path
        d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.6l4.02 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [mode, setMode] = useState<Mode>('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [signupConfirmSent, setSignupConfirmSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendError, setResendError] = useState<string | null>(null);

  // Keeps whatever email was already typed (nice when hopping from "sign in"
  // to "forgot password") but clears passwords and any confirmation/error
  // state left over from the previous mode.
  function switchMode(next: Mode) {
    setMode(next);
    setStatus('idle');
    setError(null);
    setPassword('');
    setConfirmPassword('');
    setSignupConfirmSent(false);
    setResetSent(false);
    setResendStatus('idle');
    setResendError(null);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setStatus('error');
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      setStatus('error');
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      setStatus('error');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setStatus('error');
      return;
    }
    setStatus('submitting');
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) {
        setError(error.message);
        setStatus('error');
        return;
      }
      // A session comes back immediately if the project doesn't require
      // email confirmation - otherwise data.session is null until the user
      // clicks the confirmation link, so show that instead of a false
      // "you're in" redirect.
      if (data.session) {
        router.push(next);
        router.refresh();
      } else {
        setSignupConfirmSent(true);
        setStatus('idle');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      setStatus('error');
    }
  }

  // Supabase's own default email service is often slow or unreliable
  // (exactly the "signup didn't send me an email" case this button exists
  // for) - resend() re-triggers it without making the user start signup
  // over. Supabase itself enforces a cooldown between resends and returns a
  // descriptive rate-limit error if hit too soon, so no separate client-side
  // cooldown timer is needed here.
  async function handleResend() {
    setResendStatus('sending');
    setResendError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) {
        setResendError(error.message);
        setResendStatus('error');
        return;
      }
      setResendStatus('sent');
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Request failed');
      setResendStatus('error');
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      const supabase = createClient();
      // Routed through /auth/callback (same code-exchange logic used for
      // Google sign-in) rather than straight to /auth/reset-password, so the
      // recovery code gets exchanged for a real session before that page
      // loads - it's a plain client component with no exchange logic of its
      // own.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/auth/reset-password')}`,
      });
      if (error) {
        setError(error.message);
        setStatus('error');
        return;
      }
      setResetSent(true);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      setStatus('error');
    }
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-12">
      <div className="bg-blueprint-grid bg-blueprint-grid-interactive absolute inset-0" />
      <MouseShine stacking="above-siblings" />
      <div className="glow-orb pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-primary/30 blur-[110px]" />
      <div className="glow-orb pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-primary/25 blur-[110px]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <InteractiveLogo className="mb-4 h-10 w-10 rounded-xl shadow-[0_8px_20px_-6px_color-mix(in_oklch,var(--primary)_50%,transparent)]" />
          <span className="text-sm font-semibold tracking-tight">Blueprint Studio</span>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-[0_25px_70px_-20px_color-mix(in_oklch,var(--primary)_45%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.3)] backdrop-blur-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight">
              {mode === 'signin' && 'Sign in'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset your password'}
            </h2>
            <p className="mt-1.5 text-sm text-text-secondary">
              {mode === 'signin' && 'Welcome back. Enter your email and password to continue.'}
              {mode === 'signup' && "Let's get your business set up."}
              {mode === 'forgot' && "We'll email you a link to reset your password."}
            </p>
          </div>

          {mode !== 'forgot' && (
            <Tabs value={mode} onValueChange={(v) => switchMode(v as Mode)}>
              <TabsList className="grid w-full grid-cols-2 bg-black/5">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                      <Input
                        id="email"
                        type="email"
                        required
                        autoFocus
                        placeholder="you@business.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-white/20 bg-white/40 pl-8 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-text-secondary hover:text-foreground"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                      <Input
                        id="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-white/20 bg-white/40 pl-8 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                    {status === 'submitting' ? 'Signing in…' : 'Sign in'}
                  </Button>
                  {status === 'error' && <p className="text-sm text-destructive">{error ?? 'Something went wrong. Try again.'}</p>}
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                {signupConfirmSent ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-center text-sm backdrop-blur-md">
                      <div className="flex items-center justify-center gap-1.5">
                        <Mail className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-medium">Check your email</span>
                      </div>
                      <p className="mt-1.5 text-text-secondary">
                        We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
                      </p>
                    </div>
                    <div className="text-center text-sm">
                      {resendStatus === 'sent' ? (
                        <p className="text-text-secondary">Sent again - check your inbox.</p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resendStatus === 'sending'}
                          className="text-text-secondary underline decoration-dotted underline-offset-4 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                        >
                          {resendStatus === 'sending' ? 'Resending…' : "Didn't get it? Resend email"}
                        </button>
                      )}
                      {resendStatus === 'error' && (
                        <p className="mt-1.5 text-destructive">{resendError ?? 'Something went wrong. Try again.'}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                        <Input
                          id="signup-email"
                          type="email"
                          required
                          autoFocus
                          placeholder="you@business.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="border-white/20 bg-white/40 pl-8 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                        <Input
                          id="signup-password"
                          type="password"
                          required
                          placeholder="At least 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="border-white/20 bg-white/40 pl-8 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm password</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                        <Input
                          id="confirm-password"
                          type="password"
                          required
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="border-white/20 bg-white/40 pl-8 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                      {status === 'submitting' ? 'Creating account…' : 'Create account'}
                    </Button>
                    {status === 'error' && <p className="text-sm text-destructive">{error ?? 'Something went wrong. Try again.'}</p>}
                  </form>
                )}
              </TabsContent>
            </Tabs>
          )}

          {mode === 'forgot' &&
            (resetSent ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-center text-sm backdrop-blur-md">
                  <div className="flex items-center justify-center gap-1.5">
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-medium">Check your email</span>
                  </div>
                  <p className="mt-1.5 text-text-secondary">
                    We sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="w-full text-center text-xs text-text-secondary hover:text-foreground"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                    <Input
                      id="forgot-email"
                      type="email"
                      required
                      autoFocus
                      placeholder="you@business.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-white/20 bg-white/40 pl-8 backdrop-blur-sm"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Sending link…' : 'Send reset link'}
                </Button>
                {status === 'error' && <p className="text-sm text-destructive">{error ?? 'Something went wrong. Try again.'}</p>}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="w-full text-center text-xs text-text-secondary hover:text-foreground"
                >
                  Back to sign in
                </button>
              </form>
            ))}

          {mode !== 'forgot' && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-text-secondary">
                <div className="h-px flex-1 bg-white/15" />
                or
                <div className="h-px flex-1 bg-white/15" />
              </div>

              <Button
                variant="outline"
                className="w-full border-white/20 bg-white/40 backdrop-blur-sm"
                onClick={signInWithGoogle}
              >
                <GoogleIcon />
                Continue with Google
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
