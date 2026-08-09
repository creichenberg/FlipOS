import { MockRenderProvider } from './mockProvider';
import { CreatomateRenderProvider } from './creatomateProvider';
import type { CaptionStyle, EditStyle } from '@/lib/types/database';

// A pure, provider-agnostic description of what to render - built by
// recipeBuilder.ts from the card's shots/voiceover lines/uploaded clips.
// Deliberately has no music field (skipped for now, see CLAUDE.md).
export interface RenderRecipe {
  videoCardId: string;
  businessId: string;
  aspectRatio: '9:16';
  // The business's own style preferences (businesses.caption_style/
  // edit_style) - baked into the recipe at build time rather than read by
  // the provider separately, so a provider only ever needs the recipe to
  // know exactly what to render, same as everything else here.
  captionStyle: CaptionStyle;
  editStyle: EditStyle;
  clips: {
    shotId: string;
    shotNumber: number;
    storagePath: string;
    durationSeconds: number;
  }[];
  captions: {
    voiceoverLineId: string;
    lineNumber: number;
    text: string;
    storagePath: string;
  }[];
}

export interface RenderResult {
  status: 'rendering' | 'complete' | 'failed';
  videoUrl?: string;
  errorMessage?: string;
}

// Swappable so a real vendor (Creatomate, Shotstack) can be dropped in later
// without touching any calling code - see the "Swappable" auto-editing
// decision in CLAUDE.md. CreatomateRenderProvider is the real implementation,
// selected automatically once CREATOMATE_API_KEY is set (see
// getRenderProvider() below) - nothing else in the app needs to change.
export interface RenderProvider {
  readonly name: string;
  submitRenderJob(recipe: RenderRecipe): Promise<{ providerJobId: string }>;
  // A real provider would ignore `recipe`/`submittedAt` and just ask the
  // external service about `providerJobId` - the mock provider needs them
  // since there's no external service to ask.
  getStatus(providerJobId: string, recipe: RenderRecipe, submittedAt: string): Promise<RenderResult>;
}

export function getRenderProvider(): RenderProvider {
  return process.env.CREATOMATE_API_KEY ? new CreatomateRenderProvider() : new MockRenderProvider();
}
