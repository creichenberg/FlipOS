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
    <div className="rounded-card border border-line bg-paper p-4 text-ink sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-graphite">
            {deal.category ?? 'Uncategorized'}
            {deal.condition ? ` · ${deal.condition}` : ''}
          </p>
          <h3 className="font-display text-lg font-bold leading-tight">{deal.title}</h3>
        </div>
        <FlipScoreBadge score={deal.flipScore} category={deal.flipCategory} size="sm" />
      </div>

      <p className="mt-2 text-sm text-graphite">{deal.reasoning}</p>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 font-mono">
        <div>
          <dt className="text-xs text-graphite">Buy</dt>
          <dd className="text-base font-semibold">${deal.price.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs text-graphite">Resale</dt>
          <dd className="text-base font-semibold">${deal.estimatedResaleValue.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs text-graphite">Profit</dt>
          <dd className={`text-base font-semibold ${profitPositive ? 'text-profit' : 'text-risk'}`}>
            {profitPositive ? '+' : ''}${deal.estimatedProfit.toLocaleString()} ({deal.roi.toFixed(0)}%)
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="rounded-full bg-profit-soft px-2 py-0.5 text-profit">
          Demand: {DEMAND_LABEL[deal.demand] ?? deal.demand}
        </span>
        <span className="font-medium text-graphite">{FLIP_CATEGORY_LABEL[deal.flipCategory]}</span>
      </div>

      {error && <p className="mt-2 text-xs text-risk">{error}</p>}

      <div className="mt-3 flex gap-2">
        <a
          href={deal.itemWebUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-card border border-line py-2 text-center text-sm font-medium text-ink hover:bg-paper-dim"
        >
          View on eBay
        </a>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex-1 rounded-card bg-profit py-2 text-sm font-medium text-paper transition-opacity disabled:opacity-60"
        >
          {analyzing ? 'Analyzing...' : 'Analyze in depth'}
        </button>
      </div>
    </div>
  );
}
