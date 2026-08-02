'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Film, RefreshCw, TriangleAlert, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { RenderJob } from '@/lib/types/database';

const POLL_INTERVAL_MS = 2000;

export function RenderVideoPanel({
  cardId,
  canRender,
  missingSummary,
  initialJob,
}: {
  cardId: string;
  canRender: boolean;
  missingSummary: string | null;
  initialJob: RenderJob | null;
}) {
  const [job, setJob] = useState(initialJob);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function pollUntilDone() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/cards/${cardId}/render`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? 'Failed to check render status');
        if (body.job) {
          setJob(body.job);
          if (body.job.status === 'complete' || body.job.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      } catch {
        // A single missed poll isn't worth surfacing - the next tick retries.
      }
    }, POLL_INTERVAL_MS);
  }

  async function startRender() {
    setStarting(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/render`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to start render');
      setJob(body);
      pollUntilDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start render');
    } finally {
      setStarting(false);
    }
  }

  const isActive = job?.status === 'queued' || job?.status === 'rendering';

  useEffect(() => {
    if (isActive) pollUntilDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!canRender) {
    return (
      <section className="rounded-2xl border border-dashed border-border-subtle p-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
          <Film className="h-5 w-5 text-primary" />
        </div>
        <h2 className="mt-3 text-base font-medium">Auto-edited video</h2>
        <p className="mt-1 text-sm text-text-secondary">{missingSummary}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/cards/${cardId}/film`}>Go to Filming Mode</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-text-secondary">Auto-edited video</h2>
        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          Mock render - test mode
        </span>
      </div>

      {!job && (
        <div className="mt-4 text-center">
          <p className="text-sm text-text-secondary">Every clip is uploaded - combine them into one edited video with captions.</p>
          <Button className="mt-4" onClick={startRender} disabled={starting}>
            <Wand2 className="h-4 w-4" />
            {starting ? 'Starting…' : 'Create edited video'}
          </Button>
        </div>
      )}

      {job?.status === 'queued' || job?.status === 'rendering' ? (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border-subtle bg-canvas px-4 py-3">
          <RefreshCw className="h-4 w-4 animate-spin text-primary motion-reduce:animate-none" />
          <p className="text-sm text-text-secondary">Rendering your video…</p>
        </div>
      ) : null}

      {job?.status === 'failed' && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <TriangleAlert className="h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{job.error_message ?? 'The render failed.'}</p>
          </div>
          <Button variant="outline" onClick={startRender} disabled={starting}>
            {starting ? 'Starting…' : 'Try again'}
          </Button>
        </div>
      )}

      {job?.status === 'complete' && job.video_url && (
        <div className="mt-4 space-y-3">
          <video src={job.video_url} controls className="mx-auto max-h-[480px] w-full max-w-[270px] rounded-lg bg-black" />
          <p className="text-center text-xs text-text-secondary">
            This is a mock preview (your first uploaded clip) proving the pipeline works - not a real multi-clip, captioned
            edit. Swap in a real rendering vendor when you&apos;re ready for that.
          </p>
          <div className="text-center">
            <Button variant="outline" onClick={startRender} disabled={starting}>
              <RefreshCw className="h-3.5 w-3.5" />
              {starting ? 'Starting…' : 'Regenerate'}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
