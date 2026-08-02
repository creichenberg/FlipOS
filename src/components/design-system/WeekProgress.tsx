import { CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { VideoCard } from '@/lib/types/database';

export function WeekProgress({ cards }: { cards: VideoCard[] }) {
  const total = cards.length;
  const complete = cards.filter((c) => c.status === 'complete').length;
  const percent = total > 0 ? Math.round((complete / total) * 100) : 0;
  const allDone = complete === total && total > 0;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border-subtle bg-surface px-5 py-4">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${allDone ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
        <CheckCircle2 className={`h-4 w-4 ${allDone ? 'text-emerald-500' : 'text-primary'}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{allDone ? 'Every video is filmed' : "This week's progress"}</span>
          <span className="font-mono text-xs text-text-secondary">
            {complete}/{total} filmed
          </span>
        </div>
        <div className="mt-2">
          <Progress value={percent} />
        </div>
      </div>
    </div>
  );
}
