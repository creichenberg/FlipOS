import { OUTPUT_WIDTH, OUTPUT_HEIGHT } from './creatomateProvider';
import type { RenderRecipe } from './render';

// Blueprint Studio runs on one shared Creatomate account (one
// CREATOMATE_API_KEY for the whole platform, see CLAUDE.md's Phase 2 notes),
// so credit usage is a platform-wide operator concern, not a per-business
// one - this is why the meter built from this file lives on /admin, not the
// per-business dashboard.
//
// Creatomate's REST API has no endpoint that reports the account's real
// remaining credit balance (checked against their docs - Renders, Webhooks,
// Templates, Authentication, System are the only documented resources, none
// of them account/billing). The only honest option is to *estimate* usage
// ourselves from renders we know we submitted, using Creatomate's own
// documented formula (https://creatomate.com/docs/account/how-are-credits-calculated):
// 1 credit = 100,000,000 pixels of output (width * height * fps * duration
// seconds), rounded up, minimum 1 credit per render.
//
// The one input we don't actually know is frame rate - Creatomate defaults
// it to "the highest frame rate among input videos," which depends on
// whatever phone recorded each clip and isn't something we inspect.
// ASSUMED_FPS is a stated assumption (30fps is the standard default for
// phone video), not a measurement - callers must always label this as an
// estimate, never a precise balance.
const PIXELS_PER_CREDIT = 100_000_000;
const ASSUMED_FPS = 30;

// The free-trial size documented in CLAUDE.md/creatomateProvider.ts - once
// real usage estimates past this, the business has presumably moved to a
// paid tier, so callers should stop framing usage against this ceiling.
export const CREATOMATE_FREE_TRIAL_CREDITS = 50;

export function estimateRenderCredits(recipe: Pick<RenderRecipe, 'clips'>): number {
  const durationSeconds = recipe.clips.reduce((sum, clip) => sum + clip.durationSeconds, 0);
  const credits = Math.ceil((OUTPUT_WIDTH * OUTPUT_HEIGHT * ASSUMED_FPS * durationSeconds) / PIXELS_PER_CREDIT);
  return Math.max(1, credits);
}
