import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getClient, MODEL } from './client';
import { buildBrandContextBlock } from './brandContext';
import { mockVideoDetail } from './mock';
import type { Business, VideoCard } from '@/lib/types/database';

const ShotSchema = z.object({
  shotNumber: z.number().int().min(1),
  description: z.string().describe('Exactly what to film - specific enough that a beginner knows what to do'),
  durationSeconds: z.number().min(1).describe('Approximate shot length in seconds'),
  cameraAngle: z.string().describe('e.g. "Medium shot", "Close-up", "Wide shot", "Over-the-shoulder"'),
  shotType: z.string().describe('e.g. "Talking head", "B-roll", "Product close-up", "Text overlay"'),
});

const VoiceoverLineSchema = z.object({
  lineNumber: z.number().int().min(1),
  text: z.string(),
});

const VideoDetailSchema = z.object({
  hook: z.string().describe('What is said/shown in the first 3 seconds to stop the scroll'),
  script: z.string().describe('The full on-camera script, scene by scene, in plain prose'),
  voiceoverScript: z.string().describe('The full voiceover script as continuous prose, if this video uses voiceover'),
  shots: z.array(ShotSchema).describe('Detailed, ordered shot list - specific enough for a beginner to film from'),
  voiceoverLines: z.array(VoiceoverLineSchema).describe('The voiceover broken into discrete lines/takes to record one at a time'),
  onScreenText: z.array(z.string()).describe('Text overlays that should appear on screen, in order'),
  editingSuggestions: z.string().describe('Pacing, transitions, and editing notes for assembling the final cut'),
  caption: z.string().describe('The caption to post alongside the video'),
  hashtags: z.array(z.string()),
  callToAction: z.string(),
});

export type VideoDetailResult = z.infer<typeof VideoDetailSchema>;

const SYSTEM_INSTRUCTIONS = `You are Blueprint Studio's social media strategist and video producer. You take one
video idea already chosen for this business and turn it into everything needed to actually film and
post it - the way a professional video editor briefing a business owner with zero video experience
would.

Rules:
- The shot list must be extremely specific: what to film, roughly how long, and what camera
  angle/shot type - detailed enough that someone with zero social media experience knows exactly
  what to do, shot by shot.
- Ground every line in the SPECIFIC business, product, and idea given below - never write anything
  generic enough to apply to a different business.
- voiceoverLines should be short enough to record and re-take individually - break longer voiceover
  into several discrete lines rather than one giant paragraph.
- caption and hashtags should be ready to post as-is on the platform this content is meant for.`;

export async function generateVideoDetail(business: Business, card: VideoCard): Promise<VideoDetailResult> {
  // Zero-cost path for testing the app without spending Anthropic credits -
  // see .env.example. Never set in a real deploy meant for actual customers.
  if (process.env.MOCK_AI === 'true') return mockVideoDetail(business, card);

  const client = getClient();
  const brandContext = buildBrandContextBlock(business);

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8192,
    system: [
      { type: 'text', text: brandContext, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: SYSTEM_INSTRUCTIONS },
    ],
    messages: [
      {
        role: 'user',
        content: `Produce the full video package for this idea:\n\nTitle: ${card.title}\nConcept: ${card.concept}\nContent goal: ${card.content_goal}`,
      },
    ],
    output_config: { format: zodOutputFormat(VideoDetailSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) throw new Error('Video detail generation returned no parsable output.');
  return parsed;
}
