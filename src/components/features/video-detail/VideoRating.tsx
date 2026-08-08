'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { VideoRatingValue } from '@/lib/types/database';

export function VideoRating({
  jobId,
  initialRating,
}: {
  jobId: string;
  initialRating: { rating: VideoRatingValue; feedback: string | null } | null;
}) {
  const [rating, setRating] = useState<VideoRatingValue | null>(initialRating?.rating ?? null);
  const [feedback, setFeedback] = useState(initialRating?.feedback ?? '');
  const [feedbackSent, setFeedbackSent] = useState(!!initialRating?.feedback);
  // Open by default only when there's already a down vote with no feedback
  // yet, so returning to an already-rated video doesn't re-prompt someone
  // who already dismissed it once.
  const [showFeedbackForm, setShowFeedbackForm] = useState(initialRating?.rating === 'down' && !initialRating.feedback);
  const [saving, setSaving] = useState(false);

  async function submit(value: VideoRatingValue, feedbackText?: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/render-jobs/${jobId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value, feedback: feedbackText }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'Failed to save rating');
      setRating(value);
      setFeedbackSent(!!body.rating?.feedback);
      if (value === 'down') {
        setShowFeedbackForm(!feedbackText);
      } else {
        setShowFeedbackForm(false);
        setFeedback('');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save rating');
    } finally {
      setSaving(false);
    }
  }

  async function sendFeedback() {
    await submit('down', feedback.trim());
    toast.success('Thanks for the feedback.');
  }

  return (
    <div className="mt-4 border-t border-border-subtle pt-4">
      <div className="flex items-center justify-center gap-3">
        <p className="text-xs text-text-secondary">How did this edit turn out?</p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Thumbs up"
            aria-pressed={rating === 'up'}
            disabled={saving}
            onClick={() => submit('up')}
            className={rating === 'up' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : undefined}
          >
            <ThumbsUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Thumbs down"
            aria-pressed={rating === 'down'}
            disabled={saving}
            onClick={() => submit('down')}
            className={rating === 'down' ? 'bg-destructive/10 text-destructive' : undefined}
          >
            <ThumbsDown />
          </Button>
        </div>
      </div>

      {rating === 'down' && showFeedbackForm && (
        <div className="mx-auto mt-3 max-w-sm space-y-2">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What wasn't quite right? (optional)"
            rows={2}
            maxLength={2000}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setShowFeedbackForm(false)} disabled={saving}>
              Dismiss
            </Button>
            <Button type="button" size="sm" onClick={sendFeedback} disabled={saving || !feedback.trim()}>
              Send feedback
            </Button>
          </div>
        </div>
      )}

      {rating === 'down' && !showFeedbackForm && feedbackSent && (
        <p className="mt-2 text-center text-xs text-text-secondary">Thanks for the feedback.</p>
      )}
    </div>
  );
}
