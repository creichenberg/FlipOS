'use client';

import { useState } from 'react';
import Link from 'next/link';
import StatusBadge from './StatusBadge';

export interface SavedFlipRow {
  id: string;
  status: 'SAVED' | 'PURCHASED' | 'LISTED' | 'SOLD';
  purchasePrice: number | null;
  actualSalePrice: number | null;
  actualProfit: number | null;
  actualROI: number | null;
  analysis: {
    id: string;
    identifiedProduct: string;
    flipScore: number;
    listing: { askingPrice: number };
  };
}

const NEXT_STATUS: Record<string, 'PURCHASED' | 'LISTED' | 'SOLD' | null> = {
  SAVED: 'PURCHASED',
  PURCHASED: 'LISTED',
  LISTED: 'SOLD',
  SOLD: null,
};

const NEXT_LABEL: Record<string, string> = {
  SAVED: 'Mark purchased',
  PURCHASED: 'Mark listed',
  LISTED: 'Mark sold',
};

export default function SavedFlipsList({ initialFlips }: { initialFlips: SavedFlipRow[] }) {
  const [flips, setFlips] = useState(initialFlips);

  async function advance(flip: SavedFlipRow) {
    const next = NEXT_STATUS[flip.status];
    if (!next) return;

    let body: Record<string, unknown> = { status: next };

    if (next === 'PURCHASED') {
      const price = window.prompt('Purchase price paid?', String(flip.analysis.listing.askingPrice));
      if (price === null) return;
      body.purchasePrice = parseFloat(price);
    }
    if (next === 'SOLD') {
      const price = window.prompt('Actual sale price?');
      if (price === null) return;
      body.actualSalePrice = parseFloat(price);
      if (flip.purchasePrice != null) body.purchasePrice = flip.purchasePrice;
    }

    const res = await fetch(`/api/flips/${flip.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setFlips((prev) => prev.map((f) => (f.id === flip.id ? { ...f, ...updated } : f)));
    }
  }

  if (flips.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-white/15 p-10 text-center">
        <p className="font-display text-lg font-semibold">No saved flips yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-graphite">
          Save a flip from any analysis to track it from purchase through sale.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flips.map((flip) => (
        <div key={flip.id} className="glass-card p-4 text-paper sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link href={`/analysis/${flip.analysis.id}`} className="font-display font-semibold hover:underline">
                {flip.analysis.identifiedProduct}
              </Link>
              <p className="mt-0.5 font-mono text-xs text-graphite">Flip Score {flip.analysis.flipScore}/100</p>
            </div>
            <StatusBadge status={flip.status} />
          </div>

          {flip.status === 'SOLD' ? (
            <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 font-mono text-sm">
              <div>
                <dt className="text-xs text-graphite">Sold for</dt>
                <dd className="font-semibold">${flip.actualSalePrice?.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-graphite">Actual profit</dt>
                <dd className={`font-semibold ${(flip.actualProfit ?? 0) >= 0 ? 'text-profit' : 'text-risk'}`}>
                  {(flip.actualProfit ?? 0) >= 0 ? '+' : ''}${flip.actualProfit?.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-graphite">Actual ROI</dt>
                <dd className="font-semibold">{flip.actualROI?.toFixed(1)}%</dd>
              </div>
            </dl>
          ) : (
            <button
              onClick={() => advance(flip)}
              className="mt-3 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-paper transition-colors hover:bg-white/[0.16]"
            >
              {NEXT_LABEL[flip.status]}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
