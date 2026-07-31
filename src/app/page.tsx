import Link from 'next/link';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import DealCard, { type DealCardData } from '@/components/DealCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();

  const analyses = await db.flipAnalysis.findMany({
    where: { listing: { userId: user.id } },
    include: { listing: true },
    orderBy: { flipScore: 'desc' },
    take: 20,
  });

  const deals: DealCardData[] = analyses.map((a) => ({
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

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Today&apos;s Best Flips</h1>
          <p className="mt-1 text-sm text-graphite">Ranked by Flip Score, highest first.</p>
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="rounded-card border border-dashed border-line p-10 text-center">
          <p className="font-display text-lg font-semibold">No flips analyzed yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-graphite">
            Upload a listing you&apos;re considering and FlipOS will score it in seconds.
          </p>
          <Link href="/upload" className="pill-primary mt-4 inline-block px-5 py-2.5">
            Analyze your first listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {deals.map((deal) => (
            <DealCard key={deal.analysisId} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
}
