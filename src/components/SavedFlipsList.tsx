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
    listing: { askingPrice: number; imageUrls: string[] };
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
      <div className="rounded-card border border-dashed border-line py-16 text-center">
        <p className="text-xl font-bold tracking-tight">Nothing saved yet</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-ink-soft">
          Save a flip from any analysis to track it from purchase through sale.
        </p>
        <Link href="/" className="pill-secondary mt-6 inline-block px-5 py-2.5 text-sm">
          Browse your deals
        </Link>
      </div>
    );
  }

  const sold = flips.filter((f) => f.status === 'SOLD');
  const realizedProfit = sold.reduce((sum, f) => sum + (f.actualProfit ?? 0), 0);

  return (
    <div className="space-y-5">
      {sold.length > 0 && (
        <div className="surface flex items-center justify-between gap-4 p-5">
          <div>
            <p className="eyebrow">Realized profit</p>
            <p className={`mt-1.5 text-figure tabular-nums ${realizedProfit >= 0 ? 'text-profit' : 'text-risk'}`}>
              {realizedProfit >= 0 ? '+' : '−'}${Math.abs(Math.round(realizedProfit)).toLocaleString()}
            </p>
          </div>
          <p className="text-sm text-graphite">
            across {sold.length} sold flip{sold.length === 1 ? '' : 's'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {flips.map((flip) => (
          <div key={flip.id} className="surface p-4 text-ink sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3.5">
                {flip.analysis.listing.imageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={flip.analysis.listing.imageUrls[0]}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-control bg-canvas object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-control bg-canvas text-xl font-bold text-ink/[0.15]">
                    {flip.analysis.identifiedProduct.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/analysis/${flip.analysis.id}`}
                    className="text-[16px] font-bold leading-snug tracking-tight hover:underline"
                  >
                    {flip.analysis.identifiedProduct}
                  </Link>
                  <p className="mt-1 text-xs text-graphite tabular-nums">
                    Flip Score {flip.analysis.flipScore} · bought at ${flip.analysis.listing.askingPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <StatusBadge status={flip.status} />
            </div>

            {flip.status === 'SOLD' ? (
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 tabular-nums">
                <div>
                  <dt className="eyebrow">Sold for</dt>
                  <dd className="mt-1 text-lg font-bold">${flip.actualSalePrice?.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Actual profit</dt>
                  <dd
                    className={`mt-1 text-lg font-bold ${(flip.actualProfit ?? 0) >= 0 ? 'text-profit' : 'text-risk'}`}
                  >
                    {(flip.actualProfit ?? 0) >= 0 ? '+' : '−'}$
                    {Math.abs(flip.actualProfit ?? 0).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow">Actual ROI</dt>
                  <dd className="mt-1 text-lg font-bold">{flip.actualROI?.toFixed(0)}%</dd>
                </div>
              </dl>
            ) : (
              <button onClick={() => advance(flip)} className="pill-secondary mt-4 px-4 py-2 text-sm">
                {NEXT_LABEL[flip.status]}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
