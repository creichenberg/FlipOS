'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InteractiveLogo } from '@/components/design-system/InteractiveLogo';
import { MouseShine } from '@/components/design-system/MouseShine';

const MIN_PASSWORD_LENGTH = 8;

// Reached only after /auth/callback has already exchanged the password-reset
// email's code for a real session (see login/page.tsx's handleForgotPassword,
// which routes the reset link through /auth/callback specifically so that
// exchange happens before this page loads) - so by the time this renders,
// supabase.auth.updateUser() below has a session to act on. No code-exchange
// logic of its own.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        setStatus('error');
        return;
      }
      setStatus('done');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      setStatus('error');
    }
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
            <h2 className="text-xl font-semibold tracking-tight">Set a new password</h2>
            <p className="mt-1.5 text-sm text-text-secondary">Choose a new password for your account.</p>
          </div>

          {status === 'done' ? (
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-center text-sm backdrop-blur-md">
              Password updated - taking you to your dashboard…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                  <Input
                    id="new-password"
                    type="password"
                    required
                    autoFocus
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-white/20 bg-white/40 pl-8 backdrop-blur-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm new password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                  <Input
                    id="confirm-new-password"
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
                {status === 'submitting' ? 'Updating…' : 'Update password'}
              </Button>
              {status === 'error' && <p className="text-sm text-destructive">{error ?? 'Something went wrong. Try again.'}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
