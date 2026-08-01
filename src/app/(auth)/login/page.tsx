'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Logo } from '@/components/design-system/Logo';

// Only accept a same-origin relative path (never "//host/..." or an absolute
// URL) - `next` comes from a query param on an otherwise-public URL, so
// treating it as trusted would be an open-redirect vulnerability.
function safeNext(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return '/dashboard';
}

type EmailStatus = 'idle' | 'sending' | 'sent' | 'error';
type PhoneStatus = 'idle' | 'sending' | 'verifying' | 'error';

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
  const [method, setMethod] = useState<'email' | 'phone'>('email');

  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>('idle');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setEmailStatus('sending');
    setEmailError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) {
        setEmailError(error.message);
        setEmailStatus('error');
      } else {
        setEmailStatus('sent');
      }
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Request failed');
      setEmailStatus('error');
    }
  }

  async function sendSmsCode(e: React.FormEvent) {
    e.preventDefault();
    setPhoneStatus('sending');
    setPhoneError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        setPhoneError(error.message);
        setPhoneStatus('error');
      } else {
        setPhoneStatus('idle');
        setCodeSent(true);
      }
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'Request failed');
      setPhoneStatus('error');
    }
  }

  async function verifySmsCode(e: React.FormEvent) {
    e.preventDefault();
    setPhoneStatus('verifying');
    setPhoneError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
      if (error) {
        setPhoneError(error.message);
        setPhoneStatus('error');
      } else {
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'Request failed');
      setPhoneStatus('error');
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
      <div className="bg-blueprint-grid absolute inset-0" />
      <div className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-primary/30 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-primary/25 blur-[110px]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="mb-4 h-10 w-10 rounded-xl shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)]" />
          <span className="text-sm font-semibold tracking-tight">Blueprint Studio</span>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-[0_25px_70px_-20px_rgba(79,70,229,0.45),inset_0_1px_0_0_rgba(255,255,255,0.3)] backdrop-blur-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-1.5 text-sm text-text-secondary">Welcome back. Choose how you&apos;d like to continue.</p>
          </div>

          <Tabs value={method} onValueChange={(v) => setMethod(v as 'email' | 'phone')}>
            <TabsList className="grid w-full grid-cols-2 bg-black/5">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-6">
              {emailStatus === 'sent' ? (
                <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-center text-sm backdrop-blur-md">
                  <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  Check <span className="font-medium">{email}</span> for a sign-in link.
                </div>
              ) : (
                <form onSubmit={sendMagicLink} className="space-y-4">
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
                  <Button type="submit" className="w-full" disabled={emailStatus === 'sending'}>
                    {emailStatus === 'sending' ? 'Sending link…' : 'Send magic link'}
                  </Button>
                  {emailStatus === 'error' && (
                    <p className="text-sm text-destructive">{emailError ?? 'Something went wrong. Try again.'}</p>
                  )}
                </form>
              )}
            </TabsContent>

            <TabsContent value="phone" className="mt-6">
              {codeSent ? (
                <form onSubmit={verifySmsCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification code</Label>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      required
                      autoFocus
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="border-white/20 bg-white/40 text-center text-lg tracking-[0.3em] backdrop-blur-sm"
                    />
                    <p className="text-xs text-text-secondary">
                      Sent to <span className="font-medium">{phone}</span>.
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={phoneStatus === 'verifying'}>
                    {phoneStatus === 'verifying' ? 'Verifying…' : 'Verify code'}
                  </Button>
                  {phoneStatus === 'error' && (
                    <p className="text-sm text-destructive">{phoneError ?? 'Something went wrong. Try again.'}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCodeSent(false);
                      setPhoneStatus('idle');
                      setPhoneError(null);
                      setCode('');
                    }}
                    className="w-full text-center text-xs text-text-secondary hover:text-foreground"
                  >
                    Use a different number
                  </button>
                </form>
              ) : (
                <form onSubmit={sendSmsCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                      <Input
                        id="phone"
                        type="tel"
                        required
                        autoFocus
                        placeholder="+15125550100"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="border-white/20 bg-white/40 pl-8 backdrop-blur-sm"
                      />
                    </div>
                    <p className="text-xs text-text-secondary">Include country code, e.g. +1 for the US.</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={phoneStatus === 'sending'}>
                    {phoneStatus === 'sending' ? 'Sending code…' : 'Send code'}
                  </Button>
                  {phoneStatus === 'error' && (
                    <p className="text-sm text-destructive">{phoneError ?? 'Something went wrong. Try again.'}</p>
                  )}
                </form>
              )}
            </TabsContent>
          </Tabs>

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
