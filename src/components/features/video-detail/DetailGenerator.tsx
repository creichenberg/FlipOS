'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SkeletonShotList } from '@/components/design-system/SkeletonShotList';

export function DetailGenerator({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        const res = await fetch(`/api/cards/${cardId}/generate-detail`, { method: 'POST' });
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Failed to generate shot list');
        }
        router.refresh();
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to generate shot list');
        setStatus('error');
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [cardId, router]);

  if (status === 'error') {
    return (
      <div className="space-y-3 rounded-lg border border-border-subtle bg-surface p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">Building your shot list, script, and captions…</p>
      <div className="rounded-lg border border-border-subtle bg-surface p-5">
        <SkeletonShotList />
      </div>
    </div>
  );
}
