import type { Business, ContentGoal, VideoCard } from '@/lib/types/database';
import type { WeeklyPlanCard } from './generatePlan';
import type { VideoDetailResult } from './generateVideoDetail';
import type { RegeneratedCard } from './regenerateCardIdea';

// Zero-cost stand-in for the real Claude calls, gated behind MOCK_AI=true.
// Templated from the business's actual onboarding answers rather than Claude
// output - good enough to exercise the full app (dashboard, card detail,
// Filming Mode, DB writes) without spending API credits, but not a stand-in
// for judging real generation quality.

const DAY_PLAN: { title: (b: Business) => string; concept: (b: Business) => string; contentGoal: ContentGoal }[] = [
  {
    title: (b) => `Behind the Scenes at ${b.name}`,
    concept: (b) => `A quick look at what a typical day looks like at ${b.name}, giving ${b.target_audience || 'customers'} a peek behind the curtain.`,
    contentGoal: 'build_trust',
  },
  {
    title: (b) => `3 Things Every Customer Should Know About ${b.industry}`,
    concept: (b) => `Quick, practical tips related to ${b.products_services || 'what we offer'} that make ${b.target_audience || 'our customers'} look informed.`,
    contentGoal: 'educate',
  },
  {
    title: (b) => `Why ${b.name} Is Different`,
    concept: (b) => `A direct pitch: what makes ${b.name} the right choice in ${b.industry}, aimed at ${b.target_audience || 'our target customers'}.`,
    contentGoal: 'sell',
  },
  {
    title: (b) => `The Most Common Question We Get at ${b.name}`,
    concept: (b) => `A lighthearted, relatable take on the #1 thing customers ask about ${b.products_services || 'our services'}.`,
    contentGoal: 'entertain',
  },
  {
    title: (b) => `${b.name}: This or That - Help Us Decide`,
    concept: (b) => `A quick interactive prompt inviting ${b.target_audience || 'followers'} to weigh in, built to drive comments and shares.`,
    contentGoal: 'engage',
  },
  {
    title: (b) => `The Biggest Myth About ${b.industry}`,
    concept: (b) => `Busting a common misconception ${b.target_audience || 'customers'} have, positioning ${b.name} as the expert.`,
    contentGoal: 'educate',
  },
  {
    title: (b) => `What ${b.name}'s Customers Are Saying`,
    concept: (b) => `A trust-building spotlight on real results ${b.name} has delivered for ${b.target_audience || 'customers'}.`,
    contentGoal: 'build_trust',
  },
];

export function mockWeeklyPlan(business: Business, count: number): WeeklyPlanCard[] {
  return Array.from({ length: count }, (_, i) => {
    const entry = DAY_PLAN[i % DAY_PLAN.length];
    const repeat = Math.floor(i / DAY_PLAN.length);
    return {
      dayOfWeek: i % 7,
      title: repeat > 0 ? `${entry.title(business)} (Part ${repeat + 1})` : entry.title(business),
      concept: entry.concept(business),
      contentGoal: entry.contentGoal,
    };
  });
}

export function mockRegeneratedCard(business: Business, card: VideoCard): RegeneratedCard {
  // Deterministic on the card id rather than truly random, so mock mode
  // stays reproducible - but walks the list from a per-card offset so
  // repeated presses don't all land back on the same first alternative.
  const seed = card.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  for (let offset = 1; offset <= DAY_PLAN.length; offset++) {
    const entry = DAY_PLAN[(seed + offset) % DAY_PLAN.length];
    const title = entry.title(business);
    if (title !== card.title) {
      return { title, concept: entry.concept(business), contentGoal: entry.contentGoal };
    }
  }
  const fallback = DAY_PLAN[seed % DAY_PLAN.length];
  return { title: `${fallback.title(business)} (Alt)`, concept: fallback.concept(business), contentGoal: fallback.contentGoal };
}

export function mockVideoDetail(business: Business, card: VideoCard): VideoDetailResult {
  const productLine = business.products_services || 'what we offer';

  return {
    hook: `"${card.title}" - stop scrolling if you're one of ${business.target_audience || 'our customers'} in ${business.location || 'the area'}.`,
    script: `Open on a friendly, direct-to-camera shot at ${business.name}. Introduce the topic from "${card.title}", walk through the concept in 2-3 short beats, then close with a clear call to action. Keep energy high and cuts frequent - this is a short-form video, not a lecture.`,
    voiceoverScript: `Hey, it's the team at ${business.name}. ${card.concept} If you're dealing with this, here's what you need to know. ${productLine} - and we'd love to help. Follow for more like this, or reach out today.`,
    shots: [
      {
        shotNumber: 1,
        description: `Talking head - introduce yourself and the topic directly to camera, standing somewhere recognizable at ${business.name}.`,
        durationSeconds: 4,
        cameraAngle: 'Medium shot',
        shotType: 'Talking head',
      },
      {
        shotNumber: 2,
        description: `B-roll of ${productLine} in action - hands-on footage that visually backs up what you're saying in the voiceover.`,
        durationSeconds: 5,
        cameraAngle: 'Close-up',
        shotType: 'B-roll',
      },
      {
        shotNumber: 3,
        description: 'Text overlay restating the main point in a short, punchy on-screen caption while B-roll continues.',
        durationSeconds: 3,
        cameraAngle: 'Close-up',
        shotType: 'Text overlay',
      },
      {
        shotNumber: 4,
        description: `Back to talking head for the call to action - look directly at the camera and tell viewers what to do next.`,
        durationSeconds: 4,
        cameraAngle: 'Medium shot',
        shotType: 'Talking head',
      },
    ],
    voiceoverLines: [
      { lineNumber: 1, text: `Hey, it's the team at ${business.name}.` },
      { lineNumber: 2, text: card.concept },
      { lineNumber: 3, text: `${productLine} - and we'd love to help.` },
      { lineNumber: 4, text: 'Follow for more like this, or reach out today.' },
    ],
    onScreenText: [card.title, `${business.name} • ${business.location || ''}`.trim()],
    editingSuggestions:
      'Cut fast - no shot longer than 5 seconds. Add a subtle zoom-in on the talking-head shots to keep energy up, and sync the text overlay to appear right as it\'s mentioned in the voiceover.',
    caption: `${card.title} 👇 ${card.concept}`,
    hashtags: [`#${business.industry.replace(/\s+/g, '')}`, '#smallbusiness', `#${business.location.split(',')[0]?.replace(/\s+/g, '') || 'local'}`],
    callToAction: `Follow ${business.name} for more, or reach out to book today.`,
  };
}
