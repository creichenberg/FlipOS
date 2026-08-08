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
// Subtle continuous zoom-in over each clip's own duration ("Ken Burns") so
// static handheld shots don't sit perfectly still - kept small since this
// plays on every single clip in the video, not just one hero shot.
const ZOOM_START_SCALE = '100%';
const ZOOM_END_SCALE = '106%';

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
    // rambling on for however long the clip was left recording; a subtle
    // zoom keeps every clip from sitting perfectly static; a short crossfade
    // on every clip but the first turns the hard cuts into a real edit.
    const visualElements = await Promise.all(
      recipe.clips.map(async (clip, i) => ({
        type: 'video',
        track: 1,
        source: await signedUrl(clip.storagePath),
        volume: '0%',
        trim_start: 0,
        trim_duration: clip.durationSeconds,
        animations: [
          { type: 'scale', scope: 'element', easing: 'linear', start_scale: ZOOM_START_SCALE, end_scale: ZOOM_END_SCALE, fade: false },
          ...(i > 0
            ? [{ type: 'fade', transition: true, duration: CUT_TRANSITION_SECONDS, easing: 'linear' }]
            : []),
        ],
      })),
    );

    // Voiceover + caption track: each line's recording paired with its
    // exact scripted text, grouped into a composition so the caption's
    // on-screen time automatically matches that line's real audio length.
    // We don't have (and per CLAUDE.md's no-ASR decision, don't need)
    // word-level timing to compute this ourselves - Creatomate derives the
    // composition's duration from its one determinate child (the audio),
    // and the caption text (no intrinsic duration of its own) fills it.
    const captionElements = await Promise.all(
      recipe.captions.map(async (caption) => ({
        type: 'composition',
        track: 2,
        elements: [
          { type: 'audio', source: await signedUrl(caption.storagePath) },
          {
            type: 'text',
            text: caption.text,
            width: '85%',
            y: '80%',
            x_alignment: '50%',
            y_alignment: '100%',
            fill_color: '#ffffff',
            font_family: 'Inter',
            font_weight: 700,
            font_size: '6 vmin',
            text_wrap: true,
            background_color: 'rgba(0,0,0,0.65)',
            background_x_padding: '30%',
            background_y_padding: '18%',
            background_border_radius: '20%',
          },
        ],
      })),
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
