import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getTopDeals } from '@/lib/deals';
import DealCard from '@/components/DealCard';
import StatStrip from '@/components/StatStrip';

export const dynamic = 'force-dynamic';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const deals = await getTopDeals(user.id);

  if (deals.length === 0) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <h1 className="text-display font-bold">Find your first flip</h1>
        <p className="mx-auto mt-3 text-ink-soft">
          Paste a listing link or upload a photo, and FlipOS will tell you what it&apos;s worth, whether to buy, and
          how to resell it.
        </p>
        <Link href="/upload" className="pill-primary mt-6 inline-block px-6 py-3">
          Analyze a listing
        </Link>
      </div>
    );
  }

  const [hero, ...rest] = deals;
  const heroRoi = hero.askingPrice > 0 ? (hero.estimatedProfit / hero.askingPrice) * 100 : 0;
  const heroProfitPositive = hero.estimatedProfit >= 0;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-graphite">{greeting()}</p>
          <h1 className="mt-1 text-display font-bold sm:text-display-lg">Your best flips</h1>
        </div>
        <Link href="/explore" className="pill-secondary hidden shrink-0 px-5 py-2.5 text-sm sm:inline-block">
          Swipe through →
        </Link>
      </div>

      <div className="animate-card-in">
        <StatStrip deals={deals} />
      </div>

      {/* Top-ranked deal gets a wide, image-led treatment rather than being
          just the first tile in the grid - it's the thing worth acting on. */}
      <Link
        href={`/analysis/${hero.analysisId}`}
        className="surface-interactive group grid animate-card-in overflow-hidden sm:grid-cols-2"
        style={{ animationDelay: '60ms' }}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-canvas sm:aspect-auto sm:min-h-[280px]">
          {hero.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.imageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-8xl font-bold text-ink/[0.12]">
              {(hero.category ?? hero.productTitle).charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white">
            Top pick
          </span>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8">
          <p className="text-[13px] text-graphite">
            {hero.category ?? 'Uncategorized'}
            {hero.marketplace ? ` · ${hero.marketplace}` : ''}
          </p>
          <h2 className="mt-1.5 text-2xl font-bold leading-tight tracking-tight">{hero.productTitle}</h2>

          <div className="mt-6 flex items-end gap-8">
            <div>
              <p className="eyebrow">Est. profit</p>
              <p className={`mt-1 text-figure-lg tabular-nums ${heroProfitPositive ? 'text-profit' : 'text-risk'}`}>
                {heroProfitPositive ? '+' : '−'}${Math.abs(hero.estimatedProfit).toLocaleString()}
              </p>
            </div>
            <div className="pb-1.5">
              <p className="eyebrow">ROI</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{heroRoi.toFixed(0)}%</p>
            </div>
          </div>

          <p className="mt-4 text-sm tabular-nums text-graphite">
            Buy at ${hero.askingPrice.toLocaleString()} · resells around ${hero.estimatedResaleValue.toLocaleString()}
          </p>
        </div>
      </Link>

      {rest.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold tracking-tight">More opportunities</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((deal, i) => (
              <div
                key={deal.analysisId}
                className="animate-card-in"
                style={{ animationDelay: `${Math.min(i, 8) * 40 + 120}ms` }}
              >
                <DealCard deal={deal} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
