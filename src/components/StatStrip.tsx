import type { DealCardData } from './DealCard';

/**
 * Portfolio summary across the user's analyzed deals. Turns the homepage
 * from "a list of rows" into something with a sense of standing - the
 * headline number being total profit on the table, since that's the
 * question the product exists to answer.
 */
export default function StatStrip({ deals }: { deals: DealCardData[] }) {
  const totalProfit = deals.reduce((sum, d) => sum + d.estimatedProfit, 0);
  const avgRoi =
    deals.length > 0
      ? deals.reduce((sum, d) => sum + (d.askingPrice > 0 ? (d.estimatedProfit / d.askingPrice) * 100 : 0), 0) /
        deals.length
      : 0;
  const strongCount = deals.filter((d) => d.flipCategory === 'EXCEPTIONAL' || d.flipCategory === 'STRONG').length;
  const profitPositive = totalProfit >= 0;

  // Figures step down on narrow screens - at 36px in a third of a phone
  // viewport the numbers collide. The label reserves two lines' height so a
  // wrapping label ("Worth buying") can't knock its figure off the shared
  // baseline.
  const label = 'eyebrow block min-h-[2.2em] sm:min-h-0';
  const figure = 'mt-1 text-[26px] font-extrabold leading-none tracking-tight tabular-nums sm:mt-2 sm:text-figure';

  return (
    <div className="surface grid grid-cols-3 divide-x divide-line overflow-hidden">
      <div className="p-4 sm:p-5">
        <p className={label}>
          Profit <span className="hidden sm:inline">on the table</span>
        </p>
        <p className={`${figure} ${profitPositive ? 'text-profit' : 'text-risk'}`}>
          {profitPositive ? '+' : '−'}${Math.abs(Math.round(totalProfit)).toLocaleString()}
        </p>
      </div>
      <div className="p-4 sm:p-5">
        <p className={label}>Worth buying</p>
        <p className={figure}>
          {strongCount}
          <span className="text-base font-semibold text-graphite sm:text-lg">/{deals.length}</span>
        </p>
      </div>
      <div className="p-4 sm:p-5">
        <p className={label}>
          Avg<span className="hidden sm:inline">erage</span> ROI
        </p>
        <p className={figure}>{avgRoi.toFixed(0)}%</p>
      </div>
    </div>
  );
}
