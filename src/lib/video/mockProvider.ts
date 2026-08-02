import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import type { RenderProvider, RenderRecipe, RenderResult } from './render';

// Zero-cost stand-in for a real rendering vendor (Creatomate, Shotstack -
// see the "Swappable" auto-editing decision in CLAUDE.md). Doesn't actually
// edit anything together - it "completes" after a short simulated delay
// and returns a signed URL to the first uploaded shot clip as an honest
// preview, so the whole pipeline (submit -> poll -> playable result) can be
// exercised end-to-end for $0. The UI must label this clearly as a mock so
// nobody mistakes a single unedited clip for a real multi-clip, captioned
// render.
const SIMULATED_RENDER_MS = 4000;
const PREVIEW_URL_TTL_SECONDS = 60 * 60;

export class MockRenderProvider implements RenderProvider {
  readonly name = 'mock';

  async submitRenderJob(recipe: RenderRecipe): Promise<{ providerJobId: string }> {
    void recipe; // a real provider would send this; the mock has nothing to send it to
    return { providerJobId: `mock-${randomUUID()}` };
  }

  async getStatus(_providerJobId: string, recipe: RenderRecipe, submittedAt: string): Promise<RenderResult> {
    const elapsed = Date.now() - new Date(submittedAt).getTime();
    if (elapsed < SIMULATED_RENDER_MS) {
      return { status: 'rendering' };
    }

    const firstClip = recipe.clips[0];
    if (!firstClip) {
      return { status: 'failed', errorMessage: 'No clips were uploaded for this video.' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.storage.from('clips').createSignedUrl(firstClip.storagePath, PREVIEW_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) {
      return { status: 'failed', errorMessage: error?.message ?? 'Could not generate a preview URL.' };
    }

    return { status: 'complete', videoUrl: data.signedUrl };
  }
}
