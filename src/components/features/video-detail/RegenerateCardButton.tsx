'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function RegenerateCardButton({ cardId, hasProgress }: { cardId: string; hasProgress: boolean }) {
  const [open, setOpen] = useState(false);

  if (!hasProgress) {
    return <RegenerateConfirmButton cardId={cardId} onDone={() => setOpen(false)} variant="outline" />;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate idea
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace this video idea?</DialogTitle>
          <DialogDescription>
            This swaps in a new idea for this day and deletes its script, shot list, and any clips already filmed for
            it. The rest of this week&apos;s plan is unaffected. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <RegenerateConfirmButton cardId={cardId} onDone={() => setOpen(false)} variant="destructive" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RegenerateConfirmButton({
  cardId,
  onDone,
  variant,
}: {
  cardId: string;
  onDone: () => void;
  variant: 'outline' | 'destructive';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function regenerate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/regenerate`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to regenerate idea');
      }
      toast.success('New video idea ready.');
      onDone();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to regenerate idea');
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} size={variant === 'outline' ? 'sm' : 'default'} onClick={regenerate} disabled={loading}>
      {variant === 'outline' && <RefreshCw className="h-3.5 w-3.5" />}
      {loading ? 'Regenerating…' : 'Regenerate idea'}
    </Button>
  );
}
