import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import SearchForm from '@/components/SearchForm';

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
  const ebayConfigured = Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);

  const user = await getCurrentUser();
  const preferences = await db.userPreference.findUnique({ where: { userId: user.id } });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Find Deals</h1>
      <p className="mt-1 text-sm text-graphite">
        Search live eBay listings. FlipOS quick-scores every result for flip potential before you dig in.
      </p>

      {!ebayConfigured ? (
        <div className="mt-6 rounded-card border border-dashed border-white/15 p-10 text-center">
          <p className="font-display text-lg font-semibold">eBay search isn&apos;t connected yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-graphite">
            Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to your environment to enable live search. Until then, use
            &quot;+ New Flip&quot; to analyze listings manually.
          </p>
        </div>
      ) : (
        <SearchForm
          initialPreferences={
            preferences
              ? {
                  categories: preferences.categories,
                  maxPurchasePrice: preferences.maxPurchasePrice,
                  minProfit: preferences.minProfit,
                  minROI: preferences.minROI,
                }
              : null
          }
        />
      )}
    </div>
  );
}
