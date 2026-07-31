import FlipScoreBadge from './FlipScoreBadge';
import { FLIP_CATEGORY_LABEL } from '@/types/flip';
import type { DealCardData } from './DealCard';

const DEMAND_LABEL: Record<string, string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

function riskLabel(count: number) {
  if (count === 0) return 'Low';
  if (count <= 2) return 'Medium';
  return 'High';
}

export default function ExploreCard({ deal }: { deal: DealCardData }) {
  const profitPositive = deal.estimatedProfit >= 0;
  const initial = (deal.category ?? deal.productTitle).charAt(0).toUpperCase();

  return (
    <div className="surface flex h-full w-full flex-col overflow-hidden">
      <div className="relative aspect-[4/3] w-full shrink-0 bg-canvas">
        {deal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.imageUrl} alt="" className="h-full w-full select-none object-cover" draggable={false} />
        ) : (
          <div className="flex h-full w-full select-none items-center justify-center text-8xl font-bold text-line">{initial}</div>
        )}
        <div className="absolute right-3 top-3">
          <FlipScoreBadge score={deal.flipScore} category={deal.flipCategory} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[13px] text-graphite">
          {deal.category ?? 'Uncategorized'}
          {deal.marketplace ? ` · ${deal.marketplace}` : ''}
        </p>
        <h3 className="mt-0.5 font-display text-xl font-bold leading-tight">{deal.productTitle}</h3>

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

        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-graphite">
          <span>
            Demand {DEMAND_LABEL[deal.demand] ?? deal.demand} · Risk {riskLabel(deal.riskFactorCount)}
          </span>
          <span className="font-medium text-ink">{FLIP_CATEGORY_LABEL[deal.flipCategory]}</span>
        </div>
      </div>
    </div>
  );
}
