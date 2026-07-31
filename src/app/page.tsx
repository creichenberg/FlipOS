import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getTopDeals } from '@/lib/deals';
import DealCard from '@/components/DealCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  const deals = await getTopDeals(user.id);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Today&apos;s Best Flips</h1>
          <p className="mt-1 text-sm text-graphite">Ranked by Flip Score, highest first.</p>
        </div>
        {deals.length > 0 && (
          <Link href="/explore" className="pill-secondary hidden shrink-0 px-4 py-2 text-sm sm:inline-block">
            Explore →
          </Link>
        )}
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
          {deals.map((deal, i) => (
            <div
              key={deal.analysisId}
              className="animate-card-in"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <DealCard deal={deal} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
