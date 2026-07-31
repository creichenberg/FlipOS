import Link from 'next/link';
import FlipScoreBadge from './FlipScoreBadge';
import { FLIP_CATEGORY_LABEL } from '@/types/flip';

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

  return (
    <Link href={`/analysis/${deal.analysisId}`} className="surface-interactive block p-4 text-ink sm:p-5">
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
            {deal.marketplace ? ` · ${deal.marketplace}` : ''}
          </p>
          <h3 className="mt-0.5 truncate font-display text-base font-bold leading-tight">{deal.productTitle}</h3>
        </div>
        <FlipScoreBadge score={deal.flipScore} category={deal.flipCategory} size="sm" />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 tabular-nums">
        <div>
          <dt className="text-[11px] text-graphite">Buy</dt>
          <dd className="text-base font-semibold">${deal.askingPrice.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-graphite">Resale</dt>
          <dd className="text-base font-semibold">${deal.estimatedResaleValue.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-graphite">Profit</dt>
          <dd className={`text-base font-semibold ${profitPositive ? 'text-profit' : 'text-risk'}`}>
            {profitPositive ? '+' : ''}${deal.estimatedProfit.toLocaleString()}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between text-xs text-graphite">
        <span>
          Demand {DEMAND_LABEL[deal.demand] ?? deal.demand} · Risk {riskLabel(deal.riskFactorCount)}
        </span>
        <span className="font-medium text-ink">{FLIP_CATEGORY_LABEL[deal.flipCategory]} →</span>
      </div>
    </Link>
  );
}
