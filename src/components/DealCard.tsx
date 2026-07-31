import Link from 'next/link';
import FlipScoreBadge from './FlipScoreBadge';
import { FLIP_CATEGORY_LABEL } from '@/types/flip';

export interface DealCardData {
  analysisId: string;
  productTitle: string;
  category: string | null;
  marketplace: string | null;
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

  return (
    <Link
      href={`/analysis/${deal.analysisId}`}
      className="glass-card glass-card-hover group block p-5 text-paper transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-wider text-graphite">
            {deal.category ?? 'Uncategorized'}
            {deal.marketplace ? ` · ${deal.marketplace}` : ''}
          </p>
          <h3 className="mt-0.5 truncate font-display text-lg font-bold leading-tight">{deal.productTitle}</h3>
        </div>
        <FlipScoreBadge score={deal.flipScore} category={deal.flipCategory} size="sm" />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 font-mono">
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

      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex gap-2">
          <span className="chip bg-profit-soft text-profit">Demand: {DEMAND_LABEL[deal.demand] ?? deal.demand}</span>
          <span className="chip bg-caution-soft text-caution">Risk: {riskLabel(deal.riskFactorCount)}</span>
        </div>
        <span className="font-medium text-graphite transition-colors group-hover:text-paper">
          {FLIP_CATEGORY_LABEL[deal.flipCategory]} →
        </span>
      </div>
    </Link>
  );
}
