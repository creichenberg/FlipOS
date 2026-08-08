import { createClient } from '@/lib/supabase/server';
import type { RenderProvider, RenderRecipe, RenderResult } from './render';

export class CreatomateNotConfiguredError extends Error {
  constructor() {
    super('Real video rendering is not configured. Set CREATOMATE_API_KEY.');
    this.name = 'CreatomateNotConfiguredError';
  }
}

const API_BASE = 'https://api.creatomate.com/v2';
// Long enough for Creatomate to actually fetch every source clip even if
// the render sits in their queue for a while - these are input URLs it
// reads from, unrelated to how long the finished output stays reachable.
const SOURCE_URL_TTL_SECONDS = 60 * 60;
// 9:16 - the only aspect ratio RenderRecipe supports today.
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;
// A quick crossfade instead of a hard cut between shots - long enough to
// read as an intentional edit, short enough to still feel like a punchy
// UGC cut rather than a slideshow dissolve.
const CUT_TRANSITION_SECONDS = 0.25;
// Continuous zoom over each clip's own duration ("Ken Burns") so static
// handheld shots don't sit perfectly still. Alternates in/out by clip index
// (see zoomRange() below) rather than always zooming in the same way on
// every clip - identical motion repeated across 7-10 consecutive shots reads
// as mechanical, not edited. The hook (first) clip gets a bigger push since
// it's the scroll-stopping moment.
const ZOOM_REST_SCALE = '100%';
const ZOOM_PUSH_SCALE = '106%';
const HOOK_ZOOM_PUSH_SCALE = '112%';
// Shared local track number for a caption's word elements (scoped to that
// one composition's own elements array, unrelated to the top-level track
// numbers the shot clips/caption compositions use) - every word needs the
// *same* explicit track so they queue up one after another instead of each
// getting auto-assigned its own overlaid track.
const CAPTION_WORD_TRACK = 1;
// Quick scale+fade entrance so each word visibly punches in instead of just
// appearing - the single biggest "does this look edited" tell captioning
// apps use. Short enough to stay clear of the word's own "1 fr" on-screen
// slice even on a fast-paced line.
const WORD_POP_SECONDS = 0.1;
const WORD_POP_START_SCALE = '70%';
const HOOK_WORD_POP_START_SCALE = '50%';
const WORD_POP_EASING = 'quadratic-out';
// Numbers/stats ("50%", "3 minutes", "24/7") are naturally the highest-value
// words in a line of marketing copy - a defensible, always-on heuristic that
// doesn't need an AI call or a schema change to pick out. Kept in sync with
// --primary's light-mode value (see globals.css) by hand, same as the two
// other places (icon.svg, Logo.tsx) that can't reference the CSS variable.
const EMPHASIS_COLOR = '#3881d8';

function splitIntoWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function hasDigit(word: string): boolean {
  return /\d/.test(word);
}

// First-clip zoom pushes further than the rest (the hook deserves a bigger
// moment); direction alternates by index so the motion doesn't repeat
// identically down the whole shot list.
function zoomRange(index: number): { start: string; end: string } {
  const push = index === 0 ? HOOK_ZOOM_PUSH_SCALE : ZOOM_PUSH_SCALE;
  return index % 2 === 0 ? { start: ZOOM_REST_SCALE, end: push } : { start: push, end: ZOOM_REST_SCALE };
}

// Shared styling for both the per-word captions and the (defensive,
// practically-unreachable) whole-line fallback below - only text/font_size
// differ between the two.
const CAPTION_TEXT_BASE = {
  type: 'text',
  width: '85%',
  y: '80%',
  x_alignment: '50%',
  y_alignment: '100%',
  fill_color: '#ffffff',
  font_family: 'Inter',
  font_weight: 700,
  text_wrap: true,
  background_color: 'rgba(0,0,0,0.65)',
  background_x_padding: '30%',
  background_y_padding: '18%',
  background_border_radius: '20%',
} as const;

function apiKey(): string {
  const key = process.env.CREATOMATE_API_KEY;
  if (!key) throw new CreatomateNotConfiguredError();
  return key;
}

interface CreatomateRender {
  id: string;
  status: 'planned' | 'waiting' | 'transcribing' | 'rendering' | 'succeeded' | 'failed';
  url?: string;
  error_message?: string;
}

// Real implementation of RenderProvider, on Creatomate's free-trial credits
// until a paid tier is chosen (see CLAUDE.md's Phase 2 notes and the
// "Swappable" decision this interface exists for). Builds a RenderScript
// composition directly from the recipe - no pre-built Creatomate template.
export class CreatomateRenderProvider implements RenderProvider {
  readonly name = 'creatomate';

  async submitRenderJob(recipe: RenderRecipe): Promise<{ providerJobId: string }> {
    const key = apiKey();
    const supabase = await createClient();

    async function signedUrl(storagePath: string): Promise<string> {
      const { data, error } = await supabase.storage.from('clips').createSignedUrl(storagePath, SOURCE_URL_TTL_SECONDS);
      if (error || !data?.signedUrl) throw new Error(error?.message ?? `Could not sign a URL for ${storagePath}`);
      return data.signedUrl;
    }

    // Visual track: shot clips back to back, in order, muted - the
    // voiceover track below carries the audio instead of each clip's own,
    // same as a typical UGC-style edit (B-roll under narration). Trimmed to
    // each shot's own planned duration_seconds (not however long the raw
    // recording happens to run) so pacing matches the shot list instead of
    // rambling on for however long the clip was left recording; a zoom (see
    // zoomRange()) keeps every clip from sitting perfectly static and varies
    // by clip so the motion doesn't repeat identically down the whole shot
    // list; a short crossfade on every clip but the first turns the hard
    // cuts into a real edit.
    const visualElements = await Promise.all(
      recipe.clips.map(async (clip, i) => {
        const zoom = zoomRange(i);
        return {
          type: 'video',
          track: 1,
          source: await signedUrl(clip.storagePath),
          volume: '0%',
          trim_start: 0,
          trim_duration: clip.durationSeconds,
          animations: [
            { type: 'scale', scope: 'element', easing: 'linear', start_scale: zoom.start, end_scale: zoom.end, fade: false },
            ...(i > 0
              ? [{ type: 'fade', transition: true, duration: CUT_TRANSITION_SECONDS, easing: 'linear' }]
              : []),
          ],
        };
      }),
    );

    // Voiceover + caption track: each line's recording paired with its
    // exact scripted text, grouped into a composition so the captions'
    // on-screen time automatically matches that line's real audio length.
    // We still don't have (and per CLAUDE.md's no-ASR decision, don't need)
    // real word-level timestamps - instead each word gets an equal "1 fr"
    // fractional duration, Creatomate's own mechanism for splitting a
    // track's time evenly among siblings without knowing the total
    // duration in advance (the composition's real audio-driven length).
    // This approximates a natural word-by-word caption (not perfectly
    // synced to pacing/pauses in the actual take) without adding an ASR
    // vendor. The words share one explicit track so they queue up in
    // sequence; the audio is left on its own auto-assigned track so it
    // still spans (and drives) the whole composition's duration. Each word
    // also gets a quick pop-in (scale + fade) instead of just appearing, and
    // any word containing a digit is emphasized (bigger, accent-colored) -
    // both purely mechanical, no ASR/AI call needed to pick them out. The
    // first line (the hook) gets a punchier pop and slightly bigger base
    // size, matching the bigger zoom the first clip gets above.
    const captionElements = await Promise.all(
      recipe.captions.map(async (caption, lineIndex) => {
        const isHookLine = lineIndex === 0;
        const words = splitIntoWords(caption.text);
        const wordElements =
          words.length > 0
            ? words.map((word) => {
                const emphasized = hasDigit(word);
                const fontSize = emphasized ? (isHookLine ? '10 vmin' : '8.5 vmin') : isHookLine ? '8 vmin' : '7 vmin';
                return {
                  ...CAPTION_TEXT_BASE,
                  ...(emphasized ? { fill_color: EMPHASIS_COLOR } : {}),
                  track: CAPTION_WORD_TRACK,
                  duration: '1 fr',
                  text: word,
                  font_size: fontSize,
                  animations: [
                    {
                      type: 'scale',
                      scope: 'element',
                      time: 0,
                      duration: WORD_POP_SECONDS,
                      easing: WORD_POP_EASING,
                      start_scale: isHookLine ? HOOK_WORD_POP_START_SCALE : WORD_POP_START_SCALE,
                      end_scale: '100%',
                      fade: true,
                    },
                  ],
                };
              })
            : [{ ...CAPTION_TEXT_BASE, text: caption.text, font_size: '6 vmin' }];

        return {
          type: 'composition',
          track: 2,
          elements: [{ type: 'audio', source: await signedUrl(caption.storagePath) }, ...wordElements],
        };
      }),
    );

    if (visualElements.length === 0 && captionElements.length === 0) {
      throw new Error('No uploaded clips to render.');
    }

    const res = await fetch(`${API_BASE}/renders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        output_format: 'mp4',
        width: OUTPUT_WIDTH,
        height: OUTPUT_HEIGHT,
        elements: [...visualElements, ...captionElements],
      }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const message = body?.message ?? (Array.isArray(body) ? body[0]?.message : undefined) ?? 'Creatomate render request failed';
      throw new Error(message);
    }

    const render = Array.isArray(body) ? body[0] : body;
    if (!render?.id) throw new Error('Creatomate did not return a render id.');
    return { providerJobId: render.id };
  }

  async getStatus(providerJobId: string, recipe: RenderRecipe, submittedAt: string): Promise<RenderResult> {
    // A real provider answers questions about its own render id directly -
    // unlike the mock, it needs neither the recipe nor when the job started.
    void recipe;
    void submittedAt;

    const key = apiKey();
    const res = await fetch(`${API_BASE}/renders/${providerJobId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const render = (await res.json().catch(() => null)) as CreatomateRender | null;
    if (!res.ok || !render) {
      throw new Error((render as unknown as { message?: string } | null)?.message ?? 'Failed to check render status.');
    }

    if (render.status === 'succeeded') return { status: 'complete', videoUrl: render.url };
    if (render.status === 'failed') return { status: 'failed', errorMessage: render.error_message ?? 'The render failed.' };
    return { status: 'rendering' };
  }
}
