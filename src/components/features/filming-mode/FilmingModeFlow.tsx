'use client';

import { useMemo, useReducer, useState } from 'react';
import Link from 'next/link';
import { Check, Camera, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepIndicator } from '@/components/design-system/StepIndicator';
import type { Shot, VoiceoverLine } from '@/lib/types/database';

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
  filmingSessionId,
  shots,
  voiceoverLines,
  initialDone,
}: {
  cardId: string;
  filmingSessionId: string;
  shots: Shot[];
  voiceoverLines: VoiceoverLine[];
  initialDone: string[];
}) {
  const steps: Step[] = useMemo(
    () => [
      ...shots.map((shot): Step => ({ kind: 'shot', id: shot.id, shot })),
      ...voiceoverLines.map((line): Step => ({ kind: 'voiceover', id: line.id, line })),
    ],
    [shots, voiceoverLines],
  );

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
      await fetch(`/api/filming/${cardId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filmingSessionId,
          type: current.kind,
          itemId: current.id,
          isComplete: true,
        }),
      });
      dispatch({ type: 'MARK_DONE', id: current.id });
    } finally {
      setSaving(false);
    }
  }

  if (isComplete) {
    return (
      <div className="space-y-4 rounded-lg border border-border-subtle bg-surface p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-medium">Every shot and line is filmed</h2>
        <p className="text-sm text-text-secondary">Next up: upload your clips and let Blueprint Studio put it together.</p>
        <Button asChild>
          <Link href={`/cards/${cardId}`}>Back to shot list</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-text-secondary">
          Step {doneCount + 1} of {steps.length}
        </p>
        <div className="mt-2">
          <StepIndicator current={doneCount} total={steps.length} />
        </div>
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle">
          {current.kind === 'shot' ? <Camera className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </div>

        {current.kind === 'shot' ? (
          <>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-text-secondary">
              Shot {current.shot.shot_number} · {current.shot.camera_angle}
            </p>
            <p className="mt-2 text-lg leading-snug">{current.shot.description}</p>
            <p className="mt-1 text-sm text-text-secondary">~{current.shot.duration_seconds}s · {current.shot.shot_type}</p>
          </>
        ) : (
          <>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-text-secondary">Voiceover line {current.line.line_number}</p>
            <p className="mt-2 text-lg leading-snug">&ldquo;{current.line.text}&rdquo;</p>
          </>
        )}

        <Button className="mt-6 w-full" size="lg" onClick={markDone} disabled={saving}>
          {saving ? 'Saving…' : 'Mark done'}
        </Button>
      </div>
    </div>
  );
}
