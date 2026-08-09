'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

// The card detail page's script/shot list/voiceover/on-screen-text/editing
// notes block used to render fully expanded by default - client feedback
// that it felt "overwhelming and distracting," largely because Filming Mode
// already walks through the same material shot-by-shot in a focused, guided
// flow (see FilmingModeFlow.tsx). This collapses it behind a summary line so
// the page reads as Hook -> CTA -> optional reference, not a wall of text
// before the person has even started - a plain useState toggle rather than a
// new Radix accordion dependency, since this is the only disclosure in the
// app and doesn't need multi-panel coordination.
export function ScriptDisclosure({
  shotCount,
  totalDurationSeconds,
  voiceoverLineCount,
  children,
}: {
  shotCount: number;
  totalDurationSeconds: number;
  voiceoverLineCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-secondary">Script &amp; shot list</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {shotCount} shot{shotCount === 1 ? '' : 's'} · ~{totalDurationSeconds}s total
            {voiceoverLineCount > 0 && (
              <>
                {' '}
                · {voiceoverLineCount} voiceover line{voiceoverLineCount === 1 ? '' : 's'}
              </>
            )}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id={contentId} className="mt-6 border-t border-border-subtle pt-6">
          {children}
        </div>
      )}
    </section>
  );
}
