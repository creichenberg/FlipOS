import { db } from '@/lib/db';
import type { DealCardData } from '@/components/DealCard';

// Shared by the homepage list and the /explore swipe stack - same ranking,
// same shape, so both surfaces reuse it instead of duplicating the query.
export async function getTopDeals(userId: string, limit = 20): Promise<DealCardData[]> {
  const analyses = await db.flipAnalysis.findMany({
    where: { listing: { userId } },
    include: { listing: true },
    orderBy: { flipScore: 'desc' },
    take: limit,
  });

  return analyses.map((a) => ({
    analysisId: a.id,
    productTitle: a.identifiedProduct,
    category: a.category,
    marketplace: a.listing.marketplace,
    imageUrl: a.listing.imageUrls[0] ?? null,
    askingPrice: a.listing.askingPrice,
    estimatedResaleValue: Math.round((a.estimatedResaleValueLow + a.estimatedResaleValueHigh) / 2),
    estimatedProfit: Math.round(a.estimatedProfit),
    flipScore: a.flipScore,
    flipCategory: a.flipCategory,
    demand: a.demand,
    riskFactorCount: a.riskFactors.length,
  }));
}
