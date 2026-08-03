'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { RefreshCw, TriangleAlert, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RenderingAnimation } from './RenderingAnimation';
import type { RenderJob } from '@/lib/types/database';

const POLL_INTERVAL_MS = 2000;
// However fast the real (or mock) render finishes, keep the loading
// animation on screen for at least this long - a render that resolves in
// under a second reads as broken/fake, not fast.
const MIN_DISPLAY_MS = 5000;

export function RenderVideoPanel({
  cardId,
  canRender,
  missingSummary,
  initialJob,
  defaultProviderIsMock,
}: {
  cardId: string;
  canRender: boolean;
  missingSummary: string | null;
  initialJob: RenderJob | null;
  defaultProviderIsMock: boolean;
}) {
  const [job, setJob] = useState(initialJob);
  const [displayJob, setDisplayJob] = useState(initialJob);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  // Settled results (complete/failed) are held back until the job has been
  // "in flight" for at least MIN_DISPLAY_MS, measured from the job's real
  // created_at - so a page refresh mid-render still gates correctly instead
  // of restarting the 5-second window from scratch.
  function revealWhenReady(nextJob: RenderJob) {
    const elapsed = Date.now() - new Date(nextJob.created_at).getTime();
    const remaining = MIN_DISPLAY_MS - elapsed;
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    if (remaining <= 0) {
      setDisplayJob(nextJob);
    } else {
      revealTimeoutRef.current = setTimeout(() => setDisplayJob(nextJob), remaining);
    }
  }

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
            revealWhenReady(body.job);
          } else {
            setDisplayJob(body.job);
          }
        }
      } catch {
        // A single missed poll isn't worth surfacing - the next tick retries.
      }
    }, POLL_INTERVAL_MS);
  }

  async function startRender() {
    // Best-effort, non-blocking - lets RenderNotifications.tsx show a native
    // browser notification (not just an in-app toast) if the user grants
    // it, useful since a real render can take a while and they may well
    // navigate away or switch tabs before it finishes. Tied to this button
    // press rather than asked cold on page load, since a permission prompt
    // only makes sense in the context of an action that will actually use it.
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
    setStarting(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/render`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to start render');
      setJob(body);
      setDisplayJob(body);
      pollUntilDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start render');
    } finally {
      setStarting(false);
    }
  }

  const isActive = job?.status === 'queued' || job?.status === 'rendering';
  const showFullScreenAnimation = displayJob?.status === 'queued' || displayJob?.status === 'rendering';
  // Before a job exists, fall back to which provider is currently
  // configured; once one exists, trust its own recorded provider - that's
  // what actually produced this result, even if the env config changed
  // since (e.g. mid-testing, or an old job from before a key was added).
  const isMock = displayJob ? displayJob.provider === 'mock' : defaultProviderIsMock;

  useEffect(() => {
    if (isActive) pollUntilDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The edit itself is the product's main event, so it takes over the whole
  // screen rather than playing out in a small panel - lock background scroll
  // while it's up so it reads as a real takeover, not a floating overlay.
  useEffect(() => {
    if (!showFullScreenAnimation) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showFullScreenAnimation]);

  if (!canRender) {
    return (
      <section id="auto-edit" className="rounded-xl border border-dashed border-border-subtle p-6 text-center">
        <h2 className="text-base font-medium">Auto-edited video</h2>
        <p className="mt-1 text-sm text-text-secondary">{missingSummary}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/cards/${cardId}/film`}>Go to Filming Mode</Link>
        </Button>
      </section>
    );
  }

  return (
    <section id="auto-edit" className="rounded-xl border border-border-subtle bg-surface p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-text-secondary">Auto-edited video</h2>
        {isMock && (
          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            Mock render - test mode
          </span>
        )}
      </div>

      {!displayJob && (
        <div className="mt-4 text-center">
          <p className="text-sm text-text-secondary">Every clip is uploaded - combine them into one edited video with captions.</p>
          <Button className="mt-4" onClick={startRender} disabled={starting}>
            <Wand2 className="h-4 w-4" />
            {starting ? 'Starting…' : 'Create edited video'}
          </Button>
        </div>
      )}

      {displayJob?.status === 'failed' && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <TriangleAlert className="h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{displayJob.error_message ?? 'The render failed.'}</p>
          </div>
          <Button variant="outline" onClick={startRender} disabled={starting}>
            {starting ? 'Starting…' : 'Try again'}
          </Button>
        </div>
      )}

      {displayJob?.status === 'complete' && displayJob.video_url && (
        <div className="mt-4 space-y-3">
          <video src={displayJob.video_url} controls className="mx-auto max-h-[480px] w-full max-w-[270px] rounded-lg bg-black" />
          <p className="text-center text-xs text-text-secondary">
            {isMock
              ? "This is a mock preview (your first uploaded clip) proving the pipeline works - not a real multi-clip, captioned edit. Swap in a real rendering vendor when you're ready for that."
              : 'Your clips, cut together in order with captions synced to your script.'}
          </p>
          <div className="text-center">
            <Button variant="outline" onClick={startRender} disabled={starting}>
              <RefreshCw className="h-3.5 w-3.5" />
              {starting ? 'Starting…' : 'Regenerate'}
            </Button>
          </div>
        </div>
      )}

      {showFullScreenAnimation && typeof document !== 'undefined'
        ? createPortal(
            <div className="animate-in fade-in fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-canvas/98 px-6 duration-300 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">Editing your video</p>
              <p className="text-sm text-text-secondary">This won&apos;t take long.</p>
              <div className="mt-4 w-full max-w-sm">
                <RenderingAnimation />
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
