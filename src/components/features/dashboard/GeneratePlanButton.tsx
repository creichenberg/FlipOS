'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SkeletonCardGrid } from '@/components/design-system/SkeletonCardGrid';

export function GeneratePlanButton({ businessId, label = "Generate this week's plan" }: { businessId: string; label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/plans/${businessId}/generate`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to generate plan');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate plan');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">Building this week&apos;s content plan…</p>
        <SkeletonCardGrid />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button onClick={generate}>{label}</Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
