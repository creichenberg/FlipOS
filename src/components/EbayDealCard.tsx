'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FlipScoreBadge from './FlipScoreBadge';
import { FLIP_CATEGORY_LABEL } from '@/types/flip';

export interface EbayDeal {
  ebayItemId: string;
  title: string;
  price: number;
  condition: string | null;
  imageUrl: string | null;
  itemWebUrl: string;
  category: string | null;
  location: string | null;
  flipScore: number;
  flipCategory: string;
  demand: string;
  reasoning: string;
  estimatedResaleValue: number;
  estimatedProfit: number;
  roi: number;
}

const DEMAND_LABEL: Record<string, string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

export default function EbayDealCard({ deal }: { deal: EbayDeal }) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profitPositive = deal.estimatedProfit >= 0;
  const initial = (deal.category ?? deal.title).charAt(0).toUpperCase();

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: deal.title,
          description: [deal.condition ? `Condition: ${deal.condition}` : null, `eBay listing: ${deal.itemWebUrl}`]
            .filter(Boolean)
            .join('\n'),
          askingPrice: deal.price,
          marketplace: 'eBay',
          imageUrl: deal.imageUrl ?? undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Analysis failed. Try again.');
      }

      const { analysisId } = await res.json();
      router.push(`/analysis/${analysisId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setAnalyzing(false);
    }
  }

  return (
    <div className="surface p-4 text-ink sm:p-5">
      <div className="flex items-start gap-3">
        {deal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={deal.imageUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-control bg-canvas object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-canvas text-lg font-bold text-graphite">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-graphite">
            {deal.category ?? 'Uncategorized'}
            {deal.condition ? ` · ${deal.condition}` : ''}
            {deal.location ? ` · ${deal.location}` : ''}
          </p>
          <h3 className="mt-0.5 truncate font-display text-base font-bold leading-tight">{deal.title}</h3>
        </div>
        <FlipScoreBadge score={deal.flipScore} category={deal.flipCategory} size="sm" />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-graphite">{deal.reasoning}</p>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 tabular-nums">
        <div>
          <dt className="text-[11px] text-graphite">Buy</dt>
          <dd className="text-base font-semibold">${deal.price.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-graphite">Resale</dt>
          <dd className="text-base font-semibold">${deal.estimatedResaleValue.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-graphite">Profit</dt>
          <dd className={`text-base font-semibold ${profitPositive ? 'text-profit' : 'text-risk'}`}>
            {profitPositive ? '+' : ''}${deal.estimatedProfit.toLocaleString()} ({deal.roi.toFixed(0)}%)
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between text-xs text-graphite">
        <span>Demand {DEMAND_LABEL[deal.demand] ?? deal.demand}</span>
        <span className="font-medium text-ink">{FLIP_CATEGORY_LABEL[deal.flipCategory]}</span>
      </div>

      {error && <p className="mt-2 text-xs text-risk">{error}</p>}

      <div className="mt-4 flex gap-2">
        <a href={deal.itemWebUrl} target="_blank" rel="noopener noreferrer" className="pill-secondary flex-1 text-sm">
          View on eBay
        </a>
        <button onClick={handleAnalyze} disabled={analyzing} className="pill-primary flex-1 text-sm">
          {analyzing ? 'Analyzing...' : 'Analyze in depth'}
        </button>
      </div>
    </div>
  );
}
