'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Camera, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StepIndicator } from '@/components/design-system/StepIndicator';
import { ClipUpload } from './ClipUpload';
import type { MediaUpload, Shot, VoiceoverLine } from '@/lib/types/database';

type Step =
  | { kind: 'shot'; id: string; shot: Shot }
  | { kind: 'voiceover'; id: string; line: VoiceoverLine };

export function FilmingModeFlow({
  cardId,
  businessId,
  filmingSessionId,
  shots,
  voiceoverLines,
  initialDone,
  initialUploads,
}: {
  cardId: string;
  businessId: string;
  filmingSessionId: string;
  shots: Shot[];
  voiceoverLines: VoiceoverLine[];
  initialDone: string[];
  initialUploads: MediaUpload[];
}) {
  const steps: Step[] = useMemo(
    () => [
      ...shots.map((shot): Step => ({ kind: 'shot', id: shot.id, shot })),
      ...voiceoverLines.map((line): Step => ({ kind: 'voiceover', id: line.id, line })),
    ],
    [shots, voiceoverLines],
  );

  // Latest uploaded clip's file name per shot/voiceover-line id, hydrated
  // from server data so a mid-session refresh still shows what's already
  // been captured - same pattern as initialDone below.
  const initialClipNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const upload of initialUploads) {
      const targetId = upload.shot_id ?? upload.voiceover_line_id;
      if (targetId) names[targetId] = upload.file_name;
    }
    return names;
  }, [initialUploads]);
  const [clipNames, setClipNames] = useState(initialClipNames);

  // Resume at the first not-yet-done step, hydrated from server state, so a
  // mid-session refresh picks up where the user left off. Every step must be
  // completed in order from there - there's no skipping ahead.
  const firstIncomplete = steps.findIndex((s) => !initialDone.includes(s.id));
  const [index, setIndex] = useState(firstIncomplete === -1 ? steps.length : firstIncomplete);
  const [saving, setSaving] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const current = steps[index];
  const isComplete = index >= steps.length;

  async function markDone() {
    if (!current) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/filming/${cardId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filmingSessionId,
          type: current.kind,
          itemId: current.id,
          isComplete: true,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to save progress');
      }
      // A clip was uploaded for this step - flash a checkmark before
      // advancing so the upload feels confirmed, not just silently accepted.
      if (clipNames[current.id]) {
        setJustCompleted(true);
        await new Promise((resolve) => setTimeout(resolve, 550));
        setJustCompleted(false);
      }
      setIndex((i) => i + 1);
    } catch (err) {
      // Without this, a failed save (network blip, expired session) still
      // advanced the step locally, so the user's real progress silently
      // never persisted - they'd only find out on a later refresh.
      toast.error(err instanceof Error ? err.message : 'Failed to save progress - try again');
    } finally {
      setSaving(false);
    }
  }

  if (isComplete) {
    return (
      <div className="animate-in fade-in zoom-in-95 space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center duration-500">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
          <Check className="h-5 w-5 text-emerald-500" />
        </div>
        <h2 className="text-lg font-medium">Every shot and line is filmed</h2>
        <p className="text-sm text-text-secondary">
          {Object.keys(clipNames).length > 0
            ? 'Your clips are saved - combine them into one edited video with captions next.'
            : 'Come back and upload your clips to any shot whenever they’re ready.'}
        </p>
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          {Object.keys(clipNames).length > 0 && (
            <Button asChild>
              <Link href={`/cards/${cardId}#auto-edit`}>Create edited video</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href={`/cards/${cardId}`}>Back to shot list</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-text-secondary">
          Step {index + 1} of {steps.length}
        </p>
        <div className="mt-2">
          <StepIndicator current={index} total={steps.length} />
        </div>
      </div>

      <div className="relative rounded-2xl border border-border-subtle bg-surface p-8 text-center">
        {justCompleted && (
          <div className="animate-in fade-in zoom-in-95 absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-surface duration-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        )}

        <div key={current.id} className="animate-in fade-in slide-in-from-right-2 duration-300">
          {current.kind === 'shot' ? (
            <>
              <p className="flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wide text-text-secondary">
                <Camera className="h-3.5 w-3.5 text-primary" />
                Shot {current.shot.shot_number} · {current.shot.camera_angle}
              </p>
              <p className="mt-2 text-lg leading-snug">{current.shot.description}</p>
              <p className="mt-1 text-sm text-text-secondary">~{current.shot.duration_seconds}s · {current.shot.shot_type}</p>
            </>
          ) : (
            <>
              <p className="flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wide text-text-secondary">
                <Mic className="h-3.5 w-3.5 text-primary" />
                Voiceover line {current.line.line_number}
              </p>
              <p className="mt-2 text-lg leading-snug">&ldquo;{current.line.text}&rdquo;</p>
              <p className="mt-1 text-xs text-text-secondary">
                Read it at a steady, even pace - the auto-edit&apos;s captions time themselves off this recording.
              </p>
            </>
          )}
        </div>

        <div className="mt-6">
          <ClipUpload
            key={current.id}
            businessId={businessId}
            videoCardId={cardId}
            targetId={current.id}
            targetKind={current.kind}
            initialFileName={clipNames[current.id] ?? null}
            onUploaded={(fileName) => setClipNames((names) => ({ ...names, [current.id]: fileName }))}
          />
        </div>

        <Button className="mt-3 w-full" size="lg" onClick={markDone} disabled={saving}>
          {saving ? 'Saving…' : 'Mark done'}
        </Button>
      </div>
    </div>
  );
}
