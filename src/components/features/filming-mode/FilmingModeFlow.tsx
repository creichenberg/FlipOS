'use client';

import { useMemo, useReducer, useState } from 'react';
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

interface State {
  index: number;
  done: Set<string>;
}

type Action = { type: 'MARK_DONE'; id: string } | { type: 'GO_TO'; index: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'MARK_DONE': {
      const done = new Set(state.done);
      done.add(action.id);
      return { done, index: Math.min(state.index + 1, Number.MAX_SAFE_INTEGER) };
    }
    case 'GO_TO':
      return { ...state, index: action.index };
  }
}

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
  // mid-session refresh picks up where the user left off.
  const firstIncomplete = steps.findIndex((s) => !initialDone.includes(s.id));
  const [state, dispatch] = useReducer(reducer, {
    index: firstIncomplete === -1 ? steps.length : firstIncomplete,
    done: new Set(initialDone),
  });
  const [saving, setSaving] = useState(false);

  const current = steps[state.index];
  const isComplete = state.index >= steps.length;
  const doneCount = state.done.size;

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
      dispatch({ type: 'MARK_DONE', id: current.id });
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
            ? "Your clips are saved and ready whenever you're ready to edit them together."
            : 'Come back and upload your clips to any shot whenever they’re ready.'}
        </p>
        <Button asChild>
          <Link href={`/cards/${cardId}`}>Back to shot list</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-text-secondary">
          Step {doneCount + 1} of {steps.length}
        </p>
        <div className="mt-2">
          <StepIndicator current={doneCount} total={steps.length} />
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface p-8 text-center shadow-sm">
        <div key={current.id} className="animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {current.kind === 'shot' ? <Camera className="h-5 w-5 text-primary" /> : <Mic className="h-5 w-5 text-primary" />}
          </div>

          {current.kind === 'shot' ? (
            <>
              <p className="mt-4 font-mono text-xs font-medium uppercase tracking-wide text-text-secondary">
                Shot {current.shot.shot_number} · {current.shot.camera_angle}
              </p>
              <p className="mt-2 text-lg leading-snug">{current.shot.description}</p>
              <p className="mt-1 text-sm text-text-secondary">~{current.shot.duration_seconds}s · {current.shot.shot_type}</p>
            </>
          ) : (
            <>
              <p className="mt-4 font-mono text-xs font-medium uppercase tracking-wide text-text-secondary">Voiceover line {current.line.line_number}</p>
              <p className="mt-2 text-lg leading-snug">&ldquo;{current.line.text}&rdquo;</p>
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
