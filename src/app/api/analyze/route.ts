import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { analyzeListing, AnthropicNotConfiguredError } from '@/lib/ai';
import { searchEbayListings, EbayNotConfiguredError } from '@/lib/ebay';
import { computeFinancials, flipCategoryFromScore, type FlipAnalysisResult } from '@/types/flip';

export const dynamic = 'force-dynamic';
// Claude's vision analysis alone can take several seconds; give it real
// headroom instead of Vercel's short serverless default so a real analysis
// doesn't get killed mid-request and come back as a bare timeout with no
// JSON body.
export const maxDuration = 60;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timed out')), ms)),
  ]);
}

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
  // Known photo URL for the listing (e.g. promoted from an eBay search result) -
  // display-only, separate from `images` which are sent to Claude for vision.
  imageUrl: z.string().url().optional(),
});

type AnalyzeRequest = z.infer<typeof RequestSchema>;

// Best-effort photo for the saved listing: the user's own upload wins, then a
// known source photo (e.g. the eBay result this was promoted from), then - if
// neither exists - a quick eBay lookup by product name as a representative
// reference photo. Never blocks or fails the analysis if this comes up empty.
async function resolveImageUrls(input: AnalyzeRequest, result: FlipAnalysisResult): Promise<string[]> {
  if (input.images && input.images.length > 0) {
    return input.images.map((img) => `data:${img.mediaType};base64,${img.base64}`);
  }
  if (input.imageUrl) {
    return [input.imageUrl];
  }
  try {
    // Bounded to a few seconds - this is a nice-to-have fallback photo, it
    // must never be the reason the whole analysis request stalls or times out.
    const [found] = await withTimeout(searchEbayListings({ query: result.product.identifiedProduct, limit: 1 }), 5000);
    return found?.imageUrl ? [found.imageUrl] : [];
  } catch (err) {
    if (!(err instanceof EbayNotConfiguredError)) {
      console.error('Reference image lookup failed', err);
    }
    return [];
  }
}

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
    if (err instanceof AnthropicNotConfiguredError) {
      console.error(err.message);
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    console.error('AI analysis failed', err);
    return NextResponse.json({ error: 'Could not analyze this listing. Try again in a moment.' }, { status: 502 });
  }

  const financials = computeFinancials(input.askingPrice, result);
  const imageUrls = await resolveImageUrls(input, result);

  try {
    const listing = await db.listing.create({
      data: {
        userId: user.id,
        title: input.title,
        description: input.description,
        askingPrice: input.askingPrice,
        marketplace: input.marketplace,
        imageUrls,
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
  } catch (err) {
    console.error('Saving the analysis failed - is the database migrated? (npx prisma db push)', err);
    return NextResponse.json(
      { error: 'Analysis succeeded but saving it failed. The database may not be set up yet.' },
      { status: 500 }
    );
  }
}
