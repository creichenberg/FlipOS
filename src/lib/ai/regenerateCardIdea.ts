import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getClient, MODEL } from './client';
import { buildBrandContextBlock } from './brandContext';
import { mockRegeneratedCard } from './mock';
import type { Business, ContentGoal, VideoCard } from '@/lib/types/database';

const ContentGoalSchema = z.enum(['educate', 'sell', 'entertain', 'build_trust', 'engage']);

const NewIdeaSchema = z.object({
  title: z.string().describe('The video title/hook idea, specific to this business'),
  concept: z.string().describe('A short 1-2 sentence description of what the video is about'),
  contentGoal: ContentGoalSchema,
});

export interface RegeneratedCard {
  title: string;
  concept: string;
  contentGoal: ContentGoal;
}

const SYSTEM_INSTRUCTIONS = `You are Blueprint Studio's social media strategist. A business owner didn't like
one video idea from their week's content plan and wants a fresh replacement for just that one day - the rest
of the week's plan stays as-is.

Rules:
- The new idea must be SPECIFIC to this business - its actual products/services, customers, and industry.
  Never write anything generic enough to apply to any random business in the category.
- Don't repeat the idea being replaced, and don't duplicate any of the other ideas already planned for this
  week - give a genuinely different angle.
- The title should read like a real video hook, not a bland topic label.`;

export async function regenerateCardIdea(business: Business, card: VideoCard, otherTitles: string[]): Promise<RegeneratedCard> {
  // Zero-cost path for testing the app without spending Anthropic credits -
  // see .env.example. Never set in a real deploy meant for actual customers.
  if (process.env.MOCK_AI === 'true') return mockRegeneratedCard(business, card);

  const client = getClient();
  const brandContext = buildBrandContextBlock(business);

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 1024,
    // See the matching comment in generatePlan.ts.
    thinking: { type: 'disabled' },
    system: [
      { type: 'text', text: brandContext, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: SYSTEM_INSTRUCTIONS },
    ],
    messages: [
      {
        role: 'user',
        content: `Replace this video idea with a new one:\n\nCurrent title: ${card.title}\nCurrent concept: ${card.concept}\n\nOther ideas already planned this week (don't duplicate these):\n${otherTitles.length > 0 ? otherTitles.map((t) => `- ${t}`).join('\n') : '(none)'}`,
      },
    ],
    output_config: { format: zodOutputFormat(NewIdeaSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) throw new Error('Card regeneration returned no parsable output.');
  return parsed;
}
