import { MockRenderProvider } from './mockProvider';

// A pure, provider-agnostic description of what to render - built by
// recipeBuilder.ts from the card's shots/voiceover lines/uploaded clips.
// Deliberately has no music field (skipped for now, see CLAUDE.md).
export interface RenderRecipe {
  videoCardId: string;
  businessId: string;
  aspectRatio: '9:16';
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
// without touching any calling code - see MockRenderProvider for the only
// implementation that exists today (the "Swappable" auto-editing decision
// in CLAUDE.md). Adding a real one means implementing this interface and
// returning it from getRenderProvider() based on an env var - nothing else
// in the app needs to change.
export interface RenderProvider {
  readonly name: string;
  submitRenderJob(recipe: RenderRecipe): Promise<{ providerJobId: string }>;
  // A real provider would ignore `recipe`/`submittedAt` and just ask the
  // external service about `providerJobId` - the mock provider needs them
  // since there's no external service to ask.
  getStatus(providerJobId: string, recipe: RenderRecipe, submittedAt: string): Promise<RenderResult>;
}

export function getRenderProvider(): RenderProvider {
  return new MockRenderProvider();
}
