import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getTopDeals } from '@/lib/deals';
import SwipeStack from '@/components/SwipeStack';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const user = await getCurrentUser();
  const deals = await getTopDeals(user.id);

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Explore</h1>
        <p className="mt-1 text-sm text-graphite">Swipe right to save, left to pass.</p>
      </div>

      {deals.length === 0 ? (
        <div className="rounded-card border border-dashed border-line p-10 text-center">
          <p className="font-display text-lg font-semibold">Nothing to explore yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-graphite">
            Upload a listing or run a search first, then come back to swipe through your flips.
          </p>
          <Link href="/upload" className="pill-primary mt-4 inline-block px-5 py-2.5">
            Analyze your first listing
          </Link>
        </div>
      ) : (
        <SwipeStack initialDeals={deals} />
      )}
    </div>
  );
}
