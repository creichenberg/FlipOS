'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { PlanTier } from '@/lib/plans';

// Only ever rendered when MOCK_BILLING=true (checked server-side in the
// billing page) - lets you flip your own subscription tier for free to test
// enforcement, without touching Stripe at all.
export function TestTierSwitcher({ currentTier }: { currentTier: PlanTier | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function set(plan: PlanTier | 'clear') {
    setLoading(plan);
    try {
      const res = await fetch('/api/billing/test-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan === 'clear' ? { clear: true } : { plan }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to switch plan');
      }
      toast.success(plan === 'clear' ? 'Cleared your test subscription.' : `Switched to ${plan} for free (test mode).`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to switch plan');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
      <div>
        <p className="text-sm font-medium">Test mode</p>
        <p className="text-xs text-text-secondary">
          MOCK_BILLING is on - switch your own tier for free to test enforcement, no Stripe checkout needed.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={currentTier === 'base' ? 'default' : 'outline'} disabled={loading !== null} onClick={() => set('base')}>
          {loading === 'base' ? 'Switching…' : 'Set to Base'}
        </Button>
        <Button size="sm" variant={currentTier === 'pro' ? 'default' : 'outline'} disabled={loading !== null} onClick={() => set('pro')}>
          {loading === 'pro' ? 'Switching…' : 'Set to Pro'}
        </Button>
        <Button size="sm" variant="ghost" disabled={loading !== null} onClick={() => set('clear')}>
          {loading === 'clear' ? 'Clearing…' : 'Clear (no subscription)'}
        </Button>
      </div>
    </div>
  );
}
