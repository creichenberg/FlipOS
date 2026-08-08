'use client';

import { useEffect, useState } from 'react';
import { Film, MessageSquareText, Scissors, Wand2, type LucideIcon } from 'lucide-react';

const STEPS: { label: string; icon: LucideIcon }[] = [
  { label: 'Reviewing your clips', icon: Film },
  { label: 'Syncing captions to voiceover', icon: MessageSquareText },
  { label: 'Applying cuts & transitions', icon: Scissors },
  { label: 'Rendering final video', icon: Wand2 },
];

// The backend only ever reports queued/rendering/complete/failed - no real
// percentage - so this number is a designed curve, not a measurement. It's
// shaped to make the wait feel good rather than to be accurate: fast in the
// first couple seconds (an immediate reward for clicking "Create edited
// video"), then climbs ever more slowly toward CEILING_PERCENT and never
// quite gets there - so whether the real render takes 4 seconds or 4
// minutes, the number is always still visibly climbing (never stalled dead
// at a fixed value) right up until the real job finishes, instead of racing
// to 100% on its own clock and then sitting there looking broken.
const CEILING_PERCENT = 96;
const PROGRESS_TIME_CONSTANT_MS = 2600;
const TICK_MS = 100;
// Once the real job is actually done (isReallyDone), stop the slow climb and
// snap the rest of the way to 100% quickly instead - a fast, satisfying
// finish beat rather than an abrupt cut from "83%" straight to the finished
// video with no resolution.
const FINISH_PERCENT_PER_TICK = 8;

function progressAt(elapsedMs: number): number {
  return CEILING_PERCENT * (1 - Math.exp(-elapsedMs / PROGRESS_TIME_CONSTANT_MS));
}

// startedAt (the job's real created_at, not component-mount time) means a
// mid-render page refresh resumes the curve from roughly the right point
// instead of visually restarting at 0% - the same reasoning already behind
// RenderVideoPanel's MIN_DISPLAY_MS gate.
export function RenderingAnimation({ startedAt, isReallyDone = false }: { startedAt: string; isReallyDone?: boolean }) {
  const [percent, setPercent] = useState(() => progressAt(Date.now() - new Date(startedAt).getTime()));

  useEffect(() => {
    if (isReallyDone) {
      const interval = setInterval(() => {
        setPercent((p) => Math.min(100, p + FINISH_PERCENT_PER_TICK));
      }, TICK_MS);
      return () => clearInterval(interval);
    }

    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setPercent(progressAt(Date.now() - start));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [startedAt, isReallyDone]);

  const displayPercent = Math.round(percent);
  // Keeps the step list roughly in step with the number so the two read as
  // one cohesive progress story rather than a number and a checklist that
  // happen to be near each other.
  const stepIndex = Math.min(STEPS.length - 1, Math.floor((percent / CEILING_PERCENT) * STEPS.length));

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border-subtle bg-canvas p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-4xl font-semibold tracking-tight tabular-nums text-foreground" aria-hidden="true">
          {displayPercent}%
        </span>
        <span className="text-right text-xs uppercase tracking-wide text-text-secondary">{STEPS[stepIndex].label}</span>
      </div>

      <div
        className="relative mt-3 h-2 overflow-hidden rounded-full bg-border-subtle"
        role="progressbar"
        aria-valuenow={displayPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Editing your video"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-200 ease-out"
          style={{ width: `${displayPercent}%` }}
        />
      </div>

      <ul className="mt-5 space-y-3">
        {STEPS.map((step, i) => {
          const isDone = i < stepIndex;
          const isActive = i === stepIndex;
          const Icon = step.icon;
          return (
            <li key={step.label} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                  isDone || isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-subtle bg-transparent text-text-secondary'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'animate-pulse motion-reduce:animate-none' : ''}`} />
              </span>
              <span
                className={`text-xs uppercase tracking-wide transition-colors duration-300 ${
                  isDone || isActive ? 'text-foreground' : 'text-text-secondary'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
