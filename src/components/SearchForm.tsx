'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EBAY_CATEGORIES } from '@/lib/ebayCategories';
import EbayDealCard, { type EbayDeal } from './EbayDealCard';

export interface InitialPreferences {
  categories: string[];
  maxPurchasePrice: number | null;
  minProfit: number | null;
  minROI: number | null;
}

const CONDITIONS = [
  { label: 'Any condition', value: '' },
  { label: 'New', value: 'NEW' },
  { label: 'Used', value: 'USED' },
] as const;

export default function SearchForm({ initialPreferences }: { initialPreferences: InitialPreferences | null }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [categoryLabel, setCategoryLabel] = useState(initialPreferences?.categories[0] ?? EBAY_CATEGORIES[0].label);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState(initialPreferences?.maxPurchasePrice?.toString() ?? '');
  const [condition, setCondition] = useState<'' | 'NEW' | 'USED'>('');
  const [minProfit, setMinProfit] = useState(initialPreferences?.minProfit?.toString() ?? '');
  const [minROI, setMinROI] = useState(initialPreferences?.minROI?.toString() ?? '');
  const [postalCode, setPostalCode] = useState('');
  const [nearMeOnly, setNearMeOnly] = useState(false);
  const [saveDefaults, setSaveDefaults] = useState(false);

  const [status, setStatus] = useState<'idle' | 'searching' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<EbayDeal[] | null>(null);
  const [savingAlert, setSavingAlert] = useState(false);

  function buildFilters() {
    const category = EBAY_CATEGORIES.find((c) => c.label === categoryLabel);
    return {
      categoryId: category?.categoryId,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      condition: condition || undefined,
      postalCode: postalCode || undefined,
      nearMeOnly: nearMeOnly || undefined,
      minProfit: minProfit ? parseFloat(minProfit) : undefined,
      minROI: minROI ? parseFloat(minROI) : undefined,
    };
  }

  async function handleSaveAlert() {
    if (!query.trim()) {
      setError('Enter a search term before saving an alert.');
      return;
    }
    const name = window.prompt('Name this alert', query);
    if (!name) return;

    const filters = buildFilters();
    setSavingAlert(true);
    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          query,
          categoryId: filters.categoryId,
          maxPrice: filters.maxPrice,
          minProfit: filters.minProfit,
          minROI: filters.minROI,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Could not save this alert.');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSavingAlert(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('searching');
    setError(null);

    if (nearMeOnly && !postalCode.trim()) {
      setStatus('error');
      setError('Enter your ZIP code to search near you.');
      return;
    }

    const filters = buildFilters();

    try {
      const res = await fetch('/api/ebay/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, ...filters }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Search failed. Try again.');
      }

      const body = await res.json();
      setDeals(body.deals);
      setStatus('idle');

      if (saveDefaults) {
        fetch('/api/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categories: filters.categoryId ? [categoryLabel] : [],
            maxPurchasePrice: filters.maxPrice ?? null,
            minProfit: filters.minProfit ?? null,
            minROI: filters.minROI ?? null,
          }),
        }).catch(() => {});
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="surface mt-6 space-y-5 p-5">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-graphite">
            What are you looking for?
          </label>
          <input
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Sony A7 III"
            className="field-pill mt-1.5"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-graphite">Category</label>
          <div className="-mx-1 mt-1.5 flex gap-2 overflow-x-auto px-1 pb-1">
            {EBAY_CATEGORIES.map((c) => {
              const selected = c.label === categoryLabel;
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setCategoryLabel(c.label)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selected ? 'bg-ink text-white' : 'bg-canvas text-graphite hover:text-ink'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-graphite">Min price</label>
            <input
              type="number"
              min="0"
              step="1"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Any"
              className="field mt-1.5"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-graphite">Max price</label>
            <input
              type="number"
              min="0"
              step="1"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
              className="field mt-1.5"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-graphite">Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value as typeof condition)} className="field mt-1.5">
              {CONDITIONS.map((c) => (
                <option key={c.label} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-graphite">Min profit</label>
            <input
              type="number"
              step="1"
              value={minProfit}
              onChange={(e) => setMinProfit(e.target.value)}
              placeholder="Any"
              className="field mt-1.5"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-graphite">Min ROI %</label>
            <input
              type="number"
              step="1"
              value={minROI}
              onChange={(e) => setMinROI(e.target.value)}
              placeholder="Any"
              className="field mt-1.5"
            />
          </div>
        </div>

        <div className="rounded-control bg-canvas p-3.5">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-medium uppercase tracking-wide text-graphite">Near me</label>
            <label className="flex items-center gap-2 text-sm text-graphite">
              <input type="checkbox" checked={nearMeOnly} onChange={(e) => setNearMeOnly(e.target.checked)} />
              Local pickup only
            </label>
          </div>
          <input
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="ZIP code"
            inputMode="numeric"
            className="field mt-2 bg-card"
          />
        </div>

        <div className="flex flex-col-reverse items-start gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-graphite">
            <input type="checkbox" checked={saveDefaults} onChange={(e) => setSaveDefaults(e.target.checked)} />
            Save these as my default filters
          </label>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={handleSaveAlert}
              disabled={savingAlert}
              className="pill-secondary flex-1 px-4 text-sm sm:flex-none"
            >
              {savingAlert ? 'Saving...' : 'Save as alert'}
            </button>
            <button type="submit" disabled={status === 'searching'} className="pill-primary flex-1 px-6 text-sm sm:flex-none">
              {status === 'searching' ? 'Searching...' : 'Find Deals'}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-risk">{error}</p>}
      </form>

      {deals !== null && (
        <div className="mt-6">
          {deals.length === 0 ? (
            <div className="rounded-card border border-dashed border-line p-10 text-center">
              <p className="font-display text-lg font-semibold">No deals matched</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-graphite">
                Try a broader search term or loosen your min profit / ROI filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {deals.map((deal) => (
                <EbayDealCard key={deal.ebayItemId} deal={deal} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
