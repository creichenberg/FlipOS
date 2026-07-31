import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import SearchForm from '@/components/SearchForm';
import SavedSearchList from '@/components/SavedSearchList';

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
  const ebayConfigured = Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);

  const user = await getCurrentUser();

  // UserPreference and SavedSearch are queried defensively: SavedSearch is a
  // newer table than the rest of the schema, and a database that hasn't been
  // re-migrated (`npx prisma db push`) shouldn't take the whole page down -
  // search itself doesn't depend on either of these.
  const preferences = await db.userPreference.findUnique({ where: { userId: user.id } }).catch((err) => {
    console.error('Could not load preferences - is the database migrated? (npx prisma db push)', err);
    return null;
  });
  const savedSearches = await db.savedSearch
    .findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
    .catch((err) => {
      console.error('Could not load saved searches - is the database migrated? (npx prisma db push)', err);
      return [];
    });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Find Deals</h1>
      <p className="mt-1 text-sm text-graphite">
        Search live eBay listings. FlipOS quick-scores every result for flip potential before you dig in.
      </p>

      {!ebayConfigured ? (
        <div className="mt-6 rounded-card border border-dashed border-line p-10 text-center">
          <p className="font-display text-lg font-semibold">eBay search isn&apos;t connected yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-graphite">
            Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to your environment to enable live search. Until then, use
            &quot;+ New Flip&quot; to analyze listings manually.
          </p>
        </div>
      ) : (
        <>
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
          <SavedSearchList
            initialSearches={savedSearches.map((s) => ({
              id: s.id,
              name: s.name,
              query: s.query,
              maxPrice: s.maxPrice,
              minProfit: s.minProfit,
              minROI: s.minROI,
              alertsEnabled: s.alertsEnabled,
              lastRunAt: s.lastRunAt ? s.lastRunAt.toISOString() : null,
            }))}
          />
        </>
      )}
    </div>
  );
}
