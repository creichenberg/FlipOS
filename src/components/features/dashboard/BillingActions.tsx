'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function BillingActions({ hasSubscription }: { hasSubscription: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(path: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(path, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Something went wrong');
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {hasSubscription ? (
        <Button onClick={() => go('/api/billing/portal')} disabled={loading}>
          {loading ? 'Opening…' : 'Manage billing'}
        </Button>
      ) : (
        <Button onClick={() => go('/api/billing/checkout')} disabled={loading}>
          {loading ? 'Opening…' : 'Upgrade to unlimited'}
        </Button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
