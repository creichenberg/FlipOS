import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import type { VideoCard } from '@/lib/types/database';
import { DAY_LABELS } from '@/lib/week';

const GOAL_LABELS: Record<string, string> = {
  educate: 'Educate',
  sell: 'Sell',
  entertain: 'Entertain',
  build_trust: 'Build trust',
  engage: 'Engage',
};

const STATUS_LABELS: Record<string, string> = {
  pending_detail: 'Not started',
  detail_ready: 'Ready to film',
  filming: 'Filming',
  complete: 'Filmed',
};

export function VideoCardTile({ card }: { card: VideoCard }) {
  return (
    <Link
      href={`/cards/${card.id}`}
      className="group flex flex-col justify-between rounded-lg border border-border-subtle bg-surface p-5 transition-colors hover:border-primary/40"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">{DAY_LABELS[card.day_of_week]}</span>
          <StatusBadge label={GOAL_LABELS[card.content_goal] ?? card.content_goal} variant="accent" />
        </div>
        <h3 className="mt-3 text-base font-medium leading-snug">{card.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-text-secondary">{card.concept}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <StatusBadge label={STATUS_LABELS[card.status] ?? card.status} variant={card.status === 'complete' ? 'accent' : 'neutral'} />
        <span className="text-sm font-medium text-primary group-hover:underline">
          {card.status === 'pending_detail' ? 'Generate shot list →' : 'View shot list →'}
        </span>
      </div>
    </Link>
  );
}
