import { FLIP_CATEGORY_LABEL } from '@/types/flip';

const TIER_DOT: Record<string, string> = {
  EXCEPTIONAL: 'bg-profit',
  STRONG: 'bg-profit',
  AVERAGE: 'bg-graphite',
  WEAK: 'bg-risk',
  AVOID: 'bg-risk',
};

const TIER_STROKE: Record<string, string> = {
  EXCEPTIONAL: '#137F46',
  STRONG: '#137F46',
  AVERAGE: '#8A8985',
  WEAK: '#C43D3D',
  AVOID: '#C43D3D',
};

const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Two presentations of the same metric:
 * - `sm`/`md`: a compact rating chip (tier dot + number) for card corners.
 * - `lg`: a full gauge for the analysis hero, where the score is the
 *   headline rather than a marginal annotation.
 */
export default function FlipScoreBadge({
  score,
  category,
  size = 'md',
}: {
  score: number;
  category: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (size === 'lg') {
    const progress = Math.max(0, Math.min(100, score)) / 100;
    const stroke = TIER_STROKE[category] ?? '#8A8985';

    return (
      <div className="flex flex-col items-center" title={`Flip Score ${score}/100`}>
        <div className="relative h-[92px] w-[92px]">
          <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
            <circle cx="36" cy="36" r={RADIUS} fill="none" stroke="rgba(18,18,18,0.08)" strokeWidth="6" />
            <circle
              cx="36"
              cy="36"
              r={RADIUS}
              fill="none"
              stroke={stroke}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[26px] font-extrabold leading-none tracking-tight tabular-nums">{score}</span>
            <span className="mt-0.5 text-[10px] font-medium text-graphite">/100</span>
          </div>
        </div>
        <span className="mt-2 text-xs font-semibold">{FLIP_CATEGORY_LABEL[category] ?? category}</span>
      </div>
    );
  }

  const dot = TIER_DOT[category] ?? 'bg-graphite';
  const text = size === 'sm' ? 'text-xs' : 'text-sm';
  const pad = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5';

  return (
    <div
      className={`icon-btn h-auto w-auto shrink-0 gap-1.5 rounded-full ${pad} ${text} font-semibold tabular-nums text-ink`}
      title={`Flip Score ${score}/100`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {score}
    </div>
  );
}
