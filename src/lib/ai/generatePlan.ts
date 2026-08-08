import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getClient, MODEL } from './client';
import { buildBrandContextBlock } from './brandContext';
import { mockWeeklyPlan } from './mock';
import type { Business, ContentGoal } from '@/lib/types/database';

const ContentGoalSchema = z.enum(['educate', 'sell', 'entertain', 'build_trust', 'engage']);

const VideoIdeaSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).describe('0 = Sunday, 6 = Saturday'),
  title: z.string().describe('The video title/hook idea, specific to this business'),
  concept: z.string().describe('A short 1-2 sentence description of what the video is about'),
  contentGoal: ContentGoalSchema,
});

const WeeklyPlanSchema = z.object({
  cards: z.array(VideoIdeaSchema),
});

export interface WeeklyPlanCard {
  dayOfWeek: number;
  title: string;
  concept: string;
  contentGoal: ContentGoal;
}

function systemInstructions(count: number): string {
  return `You are Blueprint Studio's social media strategist. You plan a week of short-form
video content (TikTok/Reels/Shorts) for a specific small business - the way a professional social
media manager who has worked with hundreds of businesses in this exact industry would, not a
generic content calendar.

Rules:
- Every idea must be SPECIFIC to this business - its actual products/services, customers, and
  industry. Never write an idea generic enough to apply to any random business in the category.
- Mix content goals across the week (educate, sell, entertain, build trust, engage) - don't repeat
  the same goal more than twice.
- Titles should read like a real video hook, not a bland topic label - e.g. "3 Things Every
  Homeowner Should Know Before Hiring a Plumber", not "Plumbing Tips".
- Return exactly ${count} ideas, spread across the days of the week (dayOfWeek 0-6, Sunday-Saturday).
  ${count > 7 ? 'Some days will need more than one idea since there are more ideas than days.' : count < 7 ? "It's fine to skip some days since there are fewer ideas than days in the week." : 'One idea per day.'}`;
}

// videosPerWeek is driven by the business owner's subscription tier (see
// src/lib/plans.ts) - Base is 5/week, Pro is 10/week, no active subscription
// defaults to the Base count.
export async function generateWeeklyPlan(business: Business, videosPerWeek: number): Promise<WeeklyPlanCard[]> {
  // Zero-cost path for testing the app without spending Anthropic credits -
  // see .env.example. Never set in a real deploy meant for actual customers.
  if (process.env.MOCK_AI === 'true') return mockWeeklyPlan(business, videosPerWeek);

  const client = getClient();
  const brandContext = buildBrandContextBlock(business);

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    // Sonnet 5 runs adaptive thinking by default even with no `thinking` param
    // set - extra latency and billed output tokens spent reasoning before
    // producing structured output. Not needed here: the ideas are grounded by
    // brandContext/systemInstructions and shaped by the Zod schema, not by
    // multi-step reasoning, so disabling it is a straight win on both speed
    // and cost, not a quality/cost tradeoff.
    thinking: { type: 'disabled' },
    system: [
      { type: 'text', text: brandContext, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: systemInstructions(videosPerWeek) },
    ],
    messages: [{ role: 'user', content: `Generate this week's ${videosPerWeek} video ideas for this business.` }],
    output_config: { format: zodOutputFormat(WeeklyPlanSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) throw new Error('Weekly plan generation returned no parsable output.');
  if (parsed.cards.length !== videosPerWeek) {
    throw new Error(`Weekly plan generation returned ${parsed.cards.length} cards, expected ${videosPerWeek}.`);
  }

  return parsed.cards;
}
