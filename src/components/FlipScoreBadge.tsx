const TIER_DOT: Record<string, string> = {
  EXCEPTIONAL: 'bg-profit',
  STRONG: 'bg-profit',
  AVERAGE: 'bg-graphite',
  WEAK: 'bg-risk',
  AVOID: 'bg-risk',
};

export default function FlipScoreBadge({
  score,
  category,
  size = 'md',
}: {
  score: number;
  category: string;
  size?: 'sm' | 'md';
}) {
  const dot = TIER_DOT[category] ?? 'bg-graphite';
  const text = size === 'sm' ? 'text-xs' : 'text-sm';
  const pad = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5';

  return (
    <div
      className={`icon-btn h-auto w-auto shrink-0 gap-1.5 rounded-full ${pad} ${text} font-semibold text-ink`}
      title={`Flip Score ${score}/100`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {score}
    </div>
  );
}
