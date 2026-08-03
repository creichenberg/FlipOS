import { Progress } from '@/components/ui/progress';
import type { VideoCard } from '@/lib/types/database';

export function WeekProgress({ cards }: { cards: VideoCard[] }) {
  const total = cards.length;
  const complete = cards.filter((c) => c.status === 'complete').length;
  const percent = total > 0 ? Math.round((complete / total) * 100) : 0;
  const allDone = complete === total && total > 0;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface px-5 py-4">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${allDone ? 'text-emerald-500' : ''}`}>
          {allDone ? 'Every video is filmed' : "This week's progress"}
        </span>
        <span className="font-mono text-xs text-text-secondary">
          {complete}/{total} filmed
        </span>
      </div>
      <div className="mt-2">
        <Progress value={percent} />
      </div>
    </div>
  );
}
