'use client';

import { useEffect, useState } from 'react';
import { Film, MessageSquareText, Scissors, Wand2, type LucideIcon } from 'lucide-react';

const STEPS: { label: string; icon: LucideIcon }[] = [
  { label: 'Reviewing your clips', icon: Film },
  { label: 'Syncing captions to voiceover', icon: MessageSquareText },
  { label: 'Applying cuts & transitions', icon: Scissors },
  { label: 'Rendering final video', icon: Wand2 },
];

const STEP_INTERVAL_MS = 1300;

// Purely cosmetic step sequence - the backend only ever reports
// queued/rendering/complete/failed, no granular progress, so this doesn't
// track anything real. It advances on its own timer and holds on the last
// step for however long the actual render takes, rather than looping (which
// would read as broken once the real wait runs past the animation's built-in
// length).
export function RenderingAnimation() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border-subtle bg-canvas p-5">
      <div className="relative h-1 overflow-hidden rounded-full bg-border-subtle">
        <div className="render-sweep absolute inset-y-0 w-1/3 rounded-full bg-primary" />
      </div>

      <ul className="mt-5 space-y-3">
        {STEPS.map((step, i) => {
          const isDone = i < stepIndex;
          const isActive = i === stepIndex;
          const Icon = step.icon;
          return (
            <li key={step.label} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                  isDone
                    ? 'bg-primary/10 text-primary'
                    : isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary text-text-secondary'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'animate-pulse motion-reduce:animate-none' : ''}`} />
              </span>
              <span
                className={`font-mono text-xs uppercase tracking-wide transition-colors duration-300 ${
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
