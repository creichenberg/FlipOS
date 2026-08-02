import { Lightbulb } from 'lucide-react';

// Deterministic by day-of-year rather than random, so the tip is stable
// across a refresh (and across a page revisited later the same day)
// without needing any client state.
const TIPS = [
  "Film in vertical 9:16 - it's how your audience is already holding their phone.",
  "Face a window instead of a ring light. Natural light flatters faces better than almost any gear.",
  'Say what you do in the first 3 seconds. Viewers decide whether to keep watching before you finish a sentence.',
  'Keep individual clips short - quick cuts hold attention better than one long, static take.',
  "Say your business name out loud early. Not everyone reads captions, and not every platform shows them by default.",
  'A beat of silence before a punchline makes it land harder - resist the urge to fill every second.',
  'Film a couple extra seconds before and after each shot. That buffer is what makes clean cuts possible later.',
  'Consistency beats perfection - a decent video every week outperforms a great one every month.',
  "Reply to your own top comment. It's an easy, low-effort second chance to mention your offer.",
  'Hold the phone with both hands, elbows tucked in - the single biggest fix for shaky footage.',
];

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const now = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((now - start) / 86_400_000);
}

export function TipOfTheDay() {
  const tip = TIPS[dayOfYear(new Date()) % TIPS.length];

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border-subtle bg-surface px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Lightbulb className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-primary">Tip of the day</span>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">{tip}</p>
      </div>
    </div>
  );
}
