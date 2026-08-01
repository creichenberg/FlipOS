'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Method = 'email' | 'phone';
type EmailStatus = 'idle' | 'sending' | 'sent' | 'error';
type PhoneStatus = 'idle' | 'sending' | 'verifying' | 'error';

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>('email');

  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  // Tracked separately from phoneStatus so a verify-step error keeps the code
  // entry screen visible instead of bouncing back to the phone-number form.
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
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setEmailError(error.message);
        setEmailStatus('error');
      } else {
        setEmailStatus('sent');
      }
    } catch (err) {
      // signInWithOtp can throw outright (network failure, CORS, unreachable
      // Supabase URL) rather than resolving with { error } - without this,
      // status stays stuck on "sending" forever with zero feedback, which
      // looks exactly like the button doing nothing at all.
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
        router.push('/dashboard');
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
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Blueprint Studio</h1>
          <p className="mt-2 text-sm text-text-secondary">Your AI social media manager. Sign in to continue.</p>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-md border border-border-subtle bg-surface p-1 text-sm">
          <button
            type="button"
            onClick={() => setMethod('email')}
            className={
              method === 'email'
                ? 'rounded-sm bg-secondary py-1.5 font-medium text-secondary-foreground'
                : 'rounded-sm py-1.5 text-text-secondary hover:text-foreground'
            }
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setMethod('phone')}
            className={
              method === 'phone'
                ? 'rounded-sm bg-secondary py-1.5 font-medium text-secondary-foreground'
                : 'rounded-sm py-1.5 text-text-secondary hover:text-foreground'
            }
          >
            Phone
          </button>
        </div>

        {method === 'email' &&
          (emailStatus === 'sent' ? (
            <div className="rounded-lg border border-border-subtle bg-surface p-6 text-center text-sm">
              Check <span className="font-medium">{email}</span> for a sign-in link.
            </div>
          ) : (
            <form onSubmit={sendMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={emailStatus === 'sending'}>
                {emailStatus === 'sending' ? 'Sending link…' : 'Send magic link'}
              </Button>
              {emailStatus === 'error' && (
                <p className="text-sm text-destructive">{emailError ?? 'Something went wrong. Try again.'}</p>
              )}
            </form>
          ))}

        {method === 'phone' &&
          (codeSent ? (
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
                />
                <p className="text-xs text-text-secondary">
                  Sent to <span className="font-medium">{phone}</span>.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={phoneStatus === 'verifying'}>
                {phoneStatus === 'verifying' ? 'Verifying…' : 'Verify code'}
              </Button>
              {phoneStatus === 'error' && <p className="text-sm text-destructive">{phoneError ?? 'Something went wrong. Try again.'}</p>}
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
                <Input
                  id="phone"
                  type="tel"
                  required
                  autoFocus
                  placeholder="+15125550100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-text-secondary">Include country code, e.g. +1 for the US.</p>
              </div>
              <Button type="submit" className="w-full" disabled={phoneStatus === 'sending'}>
                {phoneStatus === 'sending' ? 'Sending code…' : 'Send code'}
              </Button>
              {phoneStatus === 'error' && <p className="text-sm text-destructive">{phoneError ?? 'Something went wrong. Try again.'}</p>}
            </form>
          ))}

        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <div className="h-px flex-1 bg-border-subtle" />
          or
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
