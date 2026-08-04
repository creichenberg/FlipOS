import { Progress } from '@/components/ui/progress';
import type { VideoCard } from '@/lib/types/database';

// Deliberately unboxed - this is metadata about the page (how far along this
// week is), not its own content section, so it sits as a slim inline stat
// right under the header instead of a third bordered box competing with the
// card grid for attention.
export function WeekProgress({ cards }: { cards: VideoCard[] }) {
  const total = cards.length;
  const complete = cards.filter((c) => c.status === 'complete').length;
  const percent = total > 0 ? Math.round((complete / total) * 100) : 0;
  const allDone = complete === total && total > 0;

  return (
    <div className="flex items-center gap-3">
      <span className={`shrink-0 text-sm ${allDone ? 'font-medium text-emerald-500' : 'text-text-secondary'}`}>
        {allDone ? 'Every video is filmed' : `${complete}/${total} filmed this week`}
      </span>
      <Progress value={percent} className="max-w-40" />
    </div>
  );
}
