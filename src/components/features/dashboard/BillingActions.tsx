'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { PlanTier } from '@/lib/plans';

type LoadingKey = 'portal' | PlanTier | null;

export function BillingActions({ hasSubscription }: { hasSubscription: boolean }) {
  const [loading, setLoading] = useState<LoadingKey>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(key: Exclude<LoadingKey, null>, path: string, body?: unknown) {
    setLoading(key);
    setError(null);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const responseBody = await res.json();
      if (!res.ok) throw new Error(responseBody.error ?? 'Something went wrong');
      window.location.href = responseBody.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(null);
    }
  }

  if (hasSubscription) {
    return (
      <div className="space-y-3">
        <Button onClick={() => go('portal', '/api/billing/portal')} disabled={loading !== null}>
          {loading === 'portal' ? 'Opening…' : 'Manage billing'}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => go('base', '/api/billing/checkout', { plan: 'base' })} disabled={loading !== null} variant="outline">
          {loading === 'base' ? 'Opening…' : 'Subscribe to Base'}
        </Button>
        <Button onClick={() => go('pro', '/api/billing/checkout', { plan: 'pro' })} disabled={loading !== null}>
          {loading === 'pro' ? 'Opening…' : 'Subscribe to Pro'}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
