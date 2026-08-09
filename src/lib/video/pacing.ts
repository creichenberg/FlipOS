// A cheap, no-vendor substitute for real word-level timing: estimate how
// long a steady reading of a line should take from its word count, using a
// commonly-cited average spoken-English pace. Used to give in-app pacing
// feedback while recording a voiceover line (see ClipUpload.tsx) - since the
// auto-edit's captions still split time evenly per word (no real ASR, see
// CLAUDE.md), a take that runs dramatically longer or shorter than a steady
// reading of the exact script is itself a sign the pacing was uneven, which
// is exactly what throws that even split off. This doesn't produce real
// word-level sync - it nudges the recording itself toward the steadier,
// closer-to-target-length pace that the existing even-split approximation
// depends on.
const WORDS_PER_MINUTE = 150;
const MIN_TARGET_SECONDS = 2;

export function estimateSpeechSeconds(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(MIN_TARGET_SECONDS, Math.round((wordCount / WORDS_PER_MINUTE) * 60));
}

// Outside this fraction of the target, a take is probably rushed or dragged
// rather than just naturally a little off - worth a "try again" nudge
// rather than silently accepting it.
export const PACING_TOLERANCE = 0.3;
