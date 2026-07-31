import Link from 'next/link';
import FlipScoreBadge from './FlipScoreBadge';

export interface DealCardData {
  analysisId: string;
  productTitle: string;
  category: string | null;
  marketplace: string | null;
  imageUrl: string | null;
  askingPrice: number;
  estimatedResaleValue: number;
  estimatedProfit: number;
  flipScore: number;
  flipCategory: string;
  demand: string;
  riskFactorCount: number;
}

const DEMAND_LABEL: Record<string, string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

function riskLabel(count: number) {
  if (count === 0) return 'Low';
  if (count <= 2) return 'Medium';
  return 'High';
}

export default function DealCard({ deal }: { deal: DealCardData }) {
  const profitPositive = deal.estimatedProfit >= 0;
  const initial = (deal.category ?? deal.productTitle).charAt(0).toUpperCase();
  const roi = deal.askingPrice > 0 ? (deal.estimatedProfit / deal.askingPrice) * 100 : 0;

  return (
    <Link
      href={`/analysis/${deal.analysisId}`}
      className="surface-interactive group flex flex-col overflow-hidden text-ink"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-canvas">
        {deal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={deal.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
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
          {deal.marketplace ? ` · ${deal.marketplace}` : ''}
        </p>
        {/* Reserve two lines so the profit figures stay on a common baseline
            across a row of cards regardless of title length. */}
        <h3 className="mt-1 line-clamp-2 min-h-[2.75em] text-[17px] font-bold leading-snug tracking-tight">
          {deal.productTitle}
        </h3>

        <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="eyebrow">Est. profit</p>
            <p className={`mt-1 text-figure tabular-nums ${profitPositive ? 'text-profit' : 'text-risk'}`}>
              {profitPositive ? '+' : '−'}${Math.abs(deal.estimatedProfit).toLocaleString()}
            </p>
          </div>
          <div className="pb-1 text-right">
            <p className="eyebrow">ROI</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{roi.toFixed(0)}%</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-graphite">
          <span className="tabular-nums">
            ${deal.askingPrice.toLocaleString()} → ${deal.estimatedResaleValue.toLocaleString()}
          </span>
          <span>
            {DEMAND_LABEL[deal.demand] ?? deal.demand} demand · {riskLabel(deal.riskFactorCount)} risk
          </span>
        </div>
      </div>
    </Link>
  );
}
