'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setErrorMessage(error.message);
        setStatus('error');
      } else {
        setStatus('sent');
      }
    } catch (err) {
      // signInWithOtp can throw outright (network failure, CORS, unreachable
      // Supabase URL) rather than resolving with { error } - without this,
      // status stays stuck on "sending" forever with zero feedback, which
      // looks exactly like the button doing nothing at all.
      setErrorMessage(err instanceof Error ? err.message : 'Request failed');
      setStatus('error');
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

        {status === 'sent' ? (
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
            <Button type="submit" className="w-full" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending link…' : 'Send magic link'}
            </Button>
            {status === 'error' && <p className="text-sm text-destructive">{errorMessage ?? 'Something went wrong. Try again.'}</p>}
          </form>
        )}

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
