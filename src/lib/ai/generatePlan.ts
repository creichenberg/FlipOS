import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getClient, MODEL } from './client';
import { buildBrandContextBlock } from './brandContext';
import type { Business, ContentGoal } from '@/lib/types/database';

const ContentGoalSchema = z.enum(['educate', 'sell', 'entertain', 'build_trust', 'engage']);

const VideoIdeaSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).describe('0 = Sunday, 6 = Saturday'),
  title: z.string().describe('The video title/hook idea, specific to this business'),
  concept: z.string().describe('A short 1-2 sentence description of what the video is about'),
  contentGoal: ContentGoalSchema,
});

const WeeklyPlanSchema = z.object({
  cards: z.array(VideoIdeaSchema).describe('Exactly 7 video ideas, one per day of the week'),
});

export interface WeeklyPlanCard {
  dayOfWeek: number;
  title: string;
  concept: string;
  contentGoal: ContentGoal;
}

const SYSTEM_INSTRUCTIONS = `You are Blueprint Studio's social media strategist. You plan a week of short-form
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
- Return exactly 7 ideas, one per day of the week (dayOfWeek 0-6, Sunday-Saturday).`;

export async function generateWeeklyPlan(business: Business): Promise<WeeklyPlanCard[]> {
  const client = getClient();
  const brandContext = buildBrandContextBlock(business);

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    system: [
      { type: 'text', text: brandContext, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: SYSTEM_INSTRUCTIONS },
    ],
    messages: [{ role: 'user', content: 'Generate this week\'s 7 video ideas for this business.' }],
    output_config: { format: zodOutputFormat(WeeklyPlanSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) throw new Error('Weekly plan generation returned no parsable output.');
  if (parsed.cards.length !== 7) {
    throw new Error(`Weekly plan generation returned ${parsed.cards.length} cards, expected 7.`);
  }

  return parsed.cards;
}
