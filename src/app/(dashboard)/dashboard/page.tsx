import { CalendarDays } from 'lucide-react';
import { requireBusiness } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { currentWeekStart } from '@/lib/week';
import { PageHeader } from '@/components/design-system/PageHeader';
import { EmptyState } from '@/components/design-system/EmptyState';
import { VideoCardTile } from '@/components/design-system/VideoCardTile';
import { WeekProgress } from '@/components/design-system/WeekProgress';
import { GeneratePlanButton, RegeneratePlanButton } from '@/components/features/dashboard/GeneratePlanButton';
import { TipOfTheDay } from '@/components/features/dashboard/TipOfTheDay';

export default async function DashboardPage() {
  const business = await requireBusiness();
  const supabase = await createClient();
  const weekStartDate = currentWeekStart();

  const { data: plan } = await supabase
    .from('weekly_plans')
    .select('*')
    .eq('business_id', business.id)
    .eq('week_start_date', weekStartDate)
    .maybeSingle();

  const { data: cardsData } = plan
    ? await supabase.from('video_cards').select('*').eq('weekly_plan_id', plan.id).order('day_of_week')
    : { data: null };
  const cards = cardsData ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${business.owner_name.split(' ')[0] || business.name}`}
        description="This week's video plan - film it, and we'll auto-edit it into a finished video with captions."
        actions={plan?.status === 'ready' && cards.length > 0 ? <RegeneratePlanButton businessId={business.id} /> : undefined}
      />

      <TipOfTheDay />

      {plan?.status === 'ready' && cards.length > 0 ? (
        <>
          <WeekProgress cards={cards} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, i) => (
              <div
                key={card.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                style={{ animationDelay: `${Math.min(i, 9) * 60}ms` }}
              >
                <VideoCardTile card={card} />
              </div>
            ))}
          </div>
        </>
      ) : plan?.status === 'failed' ? (
        <EmptyState
          icon={CalendarDays}
          title="Plan generation failed"
          description="Something went wrong generating this week's plan. Try again."
          action={<GeneratePlanButton businessId={business.id} label="Try again" />}
        />
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No plan for this week yet"
          description="Generate this week's personalized video ideas, built specifically for your business."
          action={<GeneratePlanButton businessId={business.id} />}
        />
      )}
    </div>
  );
}
