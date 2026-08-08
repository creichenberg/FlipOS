'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SkeletonCardGrid } from '@/components/design-system/SkeletonCardGrid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function GeneratePlanButton({ businessId, label = "Generate this week's plan" }: { businessId: string; label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(regenerate = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/plans/${businessId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to generate plan');
      }
      toast.success(regenerate ? "This week's plan was regenerated." : "This week's plan is ready.");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to generate plan';
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-pulse text-primary motion-reduce:animate-none" />
          <p className="text-sm text-text-secondary">Building this week&apos;s content plan…</p>
        </div>
        <SkeletonCardGrid />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button onClick={() => generate(false)}>{label}</Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function RegeneratePlanButton({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate this week&apos;s plan?</DialogTitle>
          <DialogDescription>
            This replaces this week&apos;s video ideas, including any shot lists, scripts, or filming progress already
            generated for them. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <RegenerateConfirmButton businessId={businessId} onDone={() => setOpen(false)} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RegenerateConfirmButton({ businessId, onDone }: { businessId: string; onDone: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function regenerate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/plans/${businessId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to regenerate plan');
      }
      toast.success("This week's plan was regenerated.");
      onDone();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to regenerate plan');
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" onClick={regenerate} disabled={loading}>
      {loading ? 'Regenerating…' : 'Regenerate plan'}
    </Button>
  );
}
