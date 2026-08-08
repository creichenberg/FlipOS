import { Lightbulb } from 'lucide-react';

// Deterministic by day-of-year rather than random, so the tip is stable
// across a refresh (and across a page revisited later the same day)
// without needing any client state. These are specifically about how to get
// more out of Blueprint Studio itself (features easy to miss otherwise),
// not generic filming/social-media advice - every one of them should be
// checkable against a real feature in the app, not just plausible-sounding.
const TIPS = [
  "Don't love an idea? Regenerate just that one card instead of the whole week - it keeps the same link and leaves your other days untouched.",
  'Your onboarding answers shape every idea we generate. The more specific you were about your business, the more personalized your videos will be.',
  "Every card comes with a ready-to-post caption and hashtags - copy them straight from the card page once you're ready to publish.",
  'Captions in your auto-edited video appear word-by-word - for the best sync, read voiceover lines at a steady, even pace when you record them.',
  'Filming on your phone but planning from a laptop? Scan the QR code in Filming Mode to keep going from your phone - it signs you in instantly.',
  'Recording a voiceover line happens right in your browser - no separate recording app needed, just hit record and read the line.',
  "Once every shot and voiceover line has a clip, hit \"Create edited video\" - we'll cut them together and burn in captions automatically.",
  'Captions in your auto-edited video are pulled straight from your script, so what appears on screen always matches what was said.',
  "Started an edit and need to step away? You'll get notified the moment it's done, even from a different page.",
  "Check the \"Editing suggestions\" note under your shot list - it's pacing and transition guidance written specifically for that video.",
];

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const now = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((now - start) / 86_400_000);
}

export function TipOfTheDay() {
  const tip = TIPS[dayOfYear(new Date()) % TIPS.length];

  return (
    <div className="flex items-start gap-2 border-t border-border-subtle pt-6 text-sm">
      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <p className="text-text-secondary">
        <span className="font-medium text-foreground">Tip: </span>
        {tip}
      </p>
    </div>
  );
}
