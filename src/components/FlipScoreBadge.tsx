const CATEGORY_COLOR: Record<string, string> = {
  EXCEPTIONAL: '#30D158',
  STRONG: '#30D158',
  AVERAGE: '#FF9F0A',
  WEAK: '#FF453A',
  AVOID: '#FF453A',
};

const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FlipScoreBadge({
  score,
  category,
  size = 'md',
}: {
  score: number;
  category: string;
  size?: 'sm' | 'md';
}) {
  const dims = size === 'sm' ? 'h-12 w-12 text-sm' : 'h-16 w-16 text-lg';
  const color = CATEGORY_COLOR[category] ?? '#98989D';
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className={`relative ${dims} shrink-0 select-none`} title={`Flip Score ${score}/100`}>
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
        <circle
          cx="18"
          cy="18"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono font-semibold text-paper">
        {score}
      </div>
    </div>
  );
}
