import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchEbayListings, EbayNotConfiguredError } from '@/lib/ebay';
import { quickScoreListings, AnthropicNotConfiguredError } from '@/lib/ai';
import { computeFinancialsFromRange, flipCategoryFromScore } from '@/types/flip';

export const dynamic = 'force-dynamic';
// Quick-scoring up to 24 listings in one Claude call can take a while -
// give it real headroom instead of Vercel's short serverless default.
export const maxDuration = 60;

const RequestSchema = z.object({
  query: z.string().min(1),
  categoryId: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  condition: z.enum(['NEW', 'USED']).optional(),
  postalCode: z.string().optional(),
  nearMeOnly: z.boolean().optional(),
  minProfit: z.number().optional(),
  minROI: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = RequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid search', details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  let results;
  try {
    results = await searchEbayListings({
      query: input.query,
      categoryId: input.categoryId,
      minPrice: input.minPrice,
      maxPrice: input.maxPrice,
      condition: input.condition,
      postalCode: input.postalCode,
      nearMeOnly: input.nearMeOnly,
      limit: 24,
    });
  } catch (err) {
    if (err instanceof EbayNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    console.error('eBay search failed', err);
    return NextResponse.json({ error: 'Could not search eBay right now. Try again in a moment.' }, { status: 502 });
  }

  if (results.length === 0) {
    return NextResponse.json({ deals: [] });
  }

  let scores;
  try {
    scores = await quickScoreListings(
      results.map((r) => ({ id: r.ebayItemId, title: r.title, price: r.price, condition: r.condition, category: r.categoryName }))
    );
  } catch (err) {
    if (err instanceof AnthropicNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    console.error('Quick scoring failed', err);
    return NextResponse.json({ error: 'Could not score these listings. Try again in a moment.' }, { status: 502 });
  }

  const scoreById = new Map(scores.map((s) => [s.id, s]));

  const deals = results
    .map((r) => {
      const score = scoreById.get(r.ebayItemId);
      if (!score) return null;
      const financials = computeFinancialsFromRange(r.price, score.estimatedResaleValueLow, score.estimatedResaleValueHigh);
      return {
        ebayItemId: r.ebayItemId,
        title: r.title,
        price: r.price,
        condition: r.condition,
        imageUrl: r.imageUrl,
        itemWebUrl: r.itemWebUrl,
        category: r.categoryName,
        location: r.location,
        flipScore: Math.round(score.flipScore),
        flipCategory: flipCategoryFromScore(score.flipScore),
        demand: score.demand,
        reasoning: score.reasoning,
        estimatedResaleValue: financials.estimatedResaleValue,
        estimatedProfit: financials.estimatedProfit,
        roi: financials.roi,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .filter((d) => (input.minProfit != null ? d.estimatedProfit >= input.minProfit : true))
    .filter((d) => (input.minROI != null ? d.roi >= input.minROI : true))
    .sort((a, b) => b.flipScore - a.flipScore);

  return NextResponse.json({ deals });
}
