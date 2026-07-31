'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FlipScoreBadge from './FlipScoreBadge';

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
    <div className="surface flex flex-col overflow-hidden text-ink">
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-canvas">
        {deal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-ink/[0.12]">
            {initial}
          </div>
        )}
        <div className="absolute right-3 top-3">
          <FlipScoreBadge score={deal.flipScore} category={deal.flipCategory} size="sm" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="truncate text-[13px] text-graphite">
          {deal.category ?? 'Uncategorized'}
          {deal.condition ? ` · ${deal.condition}` : ''}
          {deal.location ? ` · ${deal.location}` : ''}
        </p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.75em] text-[17px] font-bold leading-snug tracking-tight">{deal.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{deal.reasoning}</p>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="eyebrow">Est. profit</p>
            <p className={`mt-1 text-figure tabular-nums ${profitPositive ? 'text-profit' : 'text-risk'}`}>
              {profitPositive ? '+' : '−'}${Math.abs(deal.estimatedProfit).toLocaleString()}
            </p>
          </div>
          <div className="pb-1 text-right">
            <p className="eyebrow">ROI</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{deal.roi.toFixed(0)}%</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-graphite">
          <span className="tabular-nums">
            ${deal.price.toLocaleString()} → ${deal.estimatedResaleValue.toLocaleString()}
          </span>
          <span>{DEMAND_LABEL[deal.demand] ?? deal.demand} demand</span>
        </div>

        {error && <p className="mt-2 text-xs text-risk">{error}</p>}

        <div className="mt-4 flex gap-2">
          <a href={deal.itemWebUrl} target="_blank" rel="noopener noreferrer" className="pill-secondary flex-1 text-sm">
            View on eBay
          </a>
          <button onClick={handleAnalyze} disabled={analyzing} className="pill-primary flex-1 text-sm">
            {analyzing ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
}
