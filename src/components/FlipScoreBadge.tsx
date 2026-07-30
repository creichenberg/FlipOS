const CATEGORY_COLOR: Record<string, string> = {
  EXCEPTIONAL: 'border-profit text-profit',
  STRONG: 'border-profit text-profit',
  AVERAGE: 'border-caution text-caution',
  WEAK: 'border-risk text-risk',
  AVOID: 'border-risk text-risk',
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
  const dims = size === 'sm' ? 'h-12 w-12 text-lg' : 'h-16 w-16 text-2xl';
  const color = CATEGORY_COLOR[category] ?? 'border-graphite text-graphite';

  return (
    <div
      className={`flex ${dims} shrink-0 -rotate-3 select-none flex-col items-center justify-center rounded-full border-2 border-dashed font-mono font-semibold ${color}`}
      title={`Flip Score ${score}/100`}
    >
      {score}
    </div>
  );
}
