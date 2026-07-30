import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { analyzeListing } from '@/lib/ai';
import { computeFinancials, flipCategoryFromScore } from '@/types/flip';

const RequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  askingPrice: z.number().positive(),
  marketplace: z.string().optional(),
  images: z
    .array(
      z.object({
        mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
        base64: z.string(),
      })
    )
    .max(6)
    .optional(),
});

export async function POST(req: NextRequest) {
  const parsed = RequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid listing data', details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const user = await getCurrentUser();

  let result;
  try {
    result = await analyzeListing({
      title: input.title,
      description: input.description,
      askingPrice: input.askingPrice,
      marketplace: input.marketplace,
      images: input.images,
    });
  } catch (err) {
    console.error('AI analysis failed', err);
    return NextResponse.json({ error: 'Could not analyze this listing. Try again in a moment.' }, { status: 502 });
  }

  const financials = computeFinancials(input.askingPrice, result);

  const listing = await db.listing.create({
    data: {
      userId: user.id,
      title: input.title,
      description: input.description,
      askingPrice: input.askingPrice,
      marketplace: input.marketplace,
      // Photos aren't persisted to storage in Phase 1 (no object storage wired up yet) -
      // they're used for the analysis call only. Add S3/R2 + imageUrls before launch.
    },
  });

  const analysis = await db.flipAnalysis.create({
    data: {
      listingId: listing.id,
      identifiedProduct: result.product.identifiedProduct,
      brand: result.product.brand,
      category: result.product.category,
      conditionAssessed: result.product.conditionAssessed,
      estimatedResaleValueLow: result.market.estimatedResaleValueLow,
      estimatedResaleValueHigh: result.market.estimatedResaleValueHigh,
      demand: result.market.demand,
      competition: result.market.competition,
      confidence: result.market.confidence,
      estimatedProfit: financials.estimatedProfit,
      roi: financials.roi,
      flipScore: Math.round(result.flipScore.score),
      flipCategory: flipCategoryFromScore(result.flipScore.score),
      flipReasoning: result.flipScore.reasoning,
      riskFactors: result.risk.riskFactors,
      thingsToCheck: result.risk.thingsToCheck,
      whyUnderpriced: result.risk.whyUnderpriced,
      buyDecision: result.buyingStrategy.decision,
      recommendedOfferPrice: result.buyingStrategy.recommendedOfferPrice,
      negotiationMessage: result.buyingStrategy.negotiationMessage,
      bestPlatform: result.sellingStrategy.bestPlatform,
      recommendedSellPrice: result.sellingStrategy.recommendedSellPrice,
      listingTitle: result.sellingStrategy.listingTitle,
      listingDescription: result.sellingStrategy.listingDescription,
      keywords: result.sellingStrategy.keywords,
      photosNeeded: result.sellingStrategy.photosNeeded,
      rawModelOutput: result,
    },
  });

  return NextResponse.json({ analysisId: analysis.id });
}
