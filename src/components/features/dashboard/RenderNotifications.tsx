'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const STATUS_POLL_MS = 5000;
// Re-checks for newly-started renders, not just already-known ones - a
// mount-once discovery would miss a render started later in the same
// session (e.g. from a card page navigated to after this layout mounted).
const DISCOVERY_POLL_MS = 8000;

// Mounted once in the dashboard layout so a render started on one card's
// page still notifies the user after they've navigated elsewhere - without
// this, RenderVideoPanel's own polling (and any chance to notice
// completion) stops the moment its component unmounts. No visible UI of
// its own; the notification is a toast (always) plus a native browser
// Notification if permission was already granted (best-effort - works even
// if the tab is backgrounded, though not if it's fully closed; there's no
// service worker/push infrastructure here, so that's the ceiling).
export function RenderNotifications() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const jobIntervals = new Map<string, ReturnType<typeof setInterval>>();

    function trackJob(cardId: string, cardTitle: string) {
      if (jobIntervals.has(cardId)) return;
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/cards/${cardId}/render`);
          const body = await res.json();
          if (!res.ok || !body.job) return;
          if (body.job.status !== 'complete' && body.job.status !== 'failed') return;

          clearInterval(interval);
          jobIntervals.delete(cardId);

          const succeeded = body.job.status === 'complete';
          toast[succeeded ? 'success' : 'error'](succeeded ? `"${cardTitle}" finished editing` : `Editing "${cardTitle}" failed`, {
            description: succeeded ? 'Your video is ready to watch.' : (body.job.error_message ?? 'Something went wrong.'),
            action: { label: 'View', onClick: () => router.push(`/cards/${cardId}#auto-edit`) },
            duration: 10000,
          });

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(succeeded ? 'Video ready' : 'Video editing failed', {
              body: succeeded ? `"${cardTitle}" finished rendering.` : `"${cardTitle}" failed to render.`,
            });
          }
        } catch {
          // A single missed poll isn't worth surfacing - the next tick retries.
        }
      }, STATUS_POLL_MS);
      jobIntervals.set(cardId, interval);
    }

    async function discover() {
      try {
        const res = await fetch('/api/render-jobs/active');
        const body = await res.json();
        if (cancelled || !res.ok) return;
        for (const job of body.jobs ?? []) trackJob(job.videoCardId, job.cardTitle);
      } catch {
        // Best-effort - a failed discovery just means an in-progress render
        // won't get a cross-page notification this poll; the card page's
        // own polling still works fine while actually viewing it.
      }
    }

    discover();
    const discoveryInterval = setInterval(discover, DISCOVERY_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(discoveryInterval);
      jobIntervals.forEach((interval) => clearInterval(interval));
    };
  }, [router]);

  return null;
}
