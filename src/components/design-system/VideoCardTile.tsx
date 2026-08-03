import Link from 'next/link';
import { ArrowRight, Lightbulb, MessageCircle, PartyPopper, ShieldCheck, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react';
import type { ContentGoal, VideoCard, VideoCardStatus } from '@/lib/types/database';
import { DAY_LABELS } from '@/lib/week';

const GOAL_LABELS: Record<string, string> = {
  educate: 'Educate',
  sell: 'Sell',
  entertain: 'Entertain',
  build_trust: 'Build trust',
  engage: 'Engage',
};

const GOAL_ICONS: Record<ContentGoal, LucideIcon> = {
  educate: Lightbulb,
  sell: TrendingUp,
  entertain: PartyPopper,
  build_trust: ShieldCheck,
  engage: MessageCircle,
};

const STATUS_LABELS: Record<string, string> = {
  pending_detail: 'Not started',
  detail_ready: 'Ready to film',
  filming: 'Filming',
  complete: 'Filmed',
};

// idea -> shot list -> filming -> done, for the mini progress bar. Every
// card has at least "idea" (1) the moment it exists, since it's already
// past generation by the time it renders here.
const STATUS_STEP: Record<VideoCardStatus, number> = {
  pending_detail: 1,
  detail_ready: 2,
  filming: 3,
  complete: 4,
};
const PROGRESS_STEPS = 4;

export function VideoCardTile({ card }: { card: VideoCard }) {
  const GoalIcon = GOAL_ICONS[card.content_goal] ?? Sparkles;
  const isToday = new Date().getDay() === card.day_of_week;
  const isComplete = card.status === 'complete';
  const filledSteps = STATUS_STEP[card.status] ?? 1;

  return (
    <Link
      href={`/cards/${card.id}`}
      className={`hover-lift group flex flex-col justify-between rounded-xl border border-border-subtle bg-surface p-5 hover:border-primary/40 ${
        isToday ? 'ring-1 ring-primary/25' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <GoalIcon className="h-3.5 w-3.5" />
            {GOAL_LABELS[card.content_goal] ?? card.content_goal}
          </span>
          <span
            className={`text-xs uppercase tracking-wide ${isToday ? 'font-semibold text-primary' : 'text-text-secondary'}`}
          >
            {DAY_LABELS[card.day_of_week]}
          </span>
        </div>
        <h3 className="mt-3 text-base font-semibold leading-snug">{card.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-text-secondary">{card.concept}</p>
      </div>

      <div className="mt-4">
        <div className="flex gap-1" aria-label={`Status: ${STATUS_LABELS[card.status] ?? card.status}`}>
          {Array.from({ length: PROGRESS_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < filledSteps ? (isComplete ? 'bg-emerald-500' : 'bg-primary') : 'bg-border-subtle'
              }`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-text-secondary">{STATUS_LABELS[card.status] ?? card.status}</span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            {card.status === 'pending_detail' ? 'Generate shot list' : 'View shot list'}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
