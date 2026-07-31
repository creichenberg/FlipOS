'use client';

import { useState } from 'react';

export interface SavedSearchRow {
  id: string;
  name: string;
  query: string;
  maxPrice: number | null;
  minProfit: number | null;
  minROI: number | null;
  alertsEnabled: boolean;
  lastRunAt: string | null;
}

export default function SavedSearchList({ initialSearches }: { initialSearches: SavedSearchRow[] }) {
  const [searches, setSearches] = useState(initialSearches);

  async function toggle(id: string, alertsEnabled: boolean) {
    setSearches((prev) => prev.map((s) => (s.id === id ? { ...s, alertsEnabled } : s)));
    await fetch(`/api/saved-searches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertsEnabled }),
    }).catch(() => {});
  }

  async function remove(id: string) {
    setSearches((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/saved-searches/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  if (searches.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xs font-bold uppercase tracking-wider text-graphite">Your alerts</h2>
      <div className="mt-3 space-y-2">
        {searches.map((s) => (
          <div key={s.id} className="surface flex items-center justify-between gap-3 p-3.5">
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold">{s.name}</p>
              <p className="truncate text-xs text-graphite">
                &quot;{s.query}&quot;
                {s.maxPrice != null ? ` · under $${s.maxPrice.toLocaleString()}` : ''}
                {s.minProfit != null ? ` · min $${s.minProfit.toLocaleString()} profit` : ''}
                {s.minROI != null ? ` · min ${s.minROI}% ROI` : ''}
                {s.lastRunAt ? ` · last checked ${new Date(s.lastRunAt).toLocaleDateString()}` : ' · not checked yet'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => toggle(s.id, !s.alertsEnabled)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  s.alertsEnabled ? 'bg-profit/10 text-profit' : 'bg-canvas text-graphite'
                }`}
              >
                {s.alertsEnabled ? 'Alerts on' : 'Alerts off'}
              </button>
              <button onClick={() => remove(s.id)} className="rounded-full px-3 py-1.5 text-xs font-medium text-graphite hover:text-risk">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
