import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWeeklyPlan } from '@/lib/ai/generatePlan';
import { AnthropicNotConfiguredError } from '@/lib/ai/client';
import { currentWeekStart } from '@/lib/week';
import type { Business } from '@/lib/types/database';

export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: business } = await supabase.from('businesses').select('*').eq('id', businessId).eq('user_id', user.id).maybeSingle();
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const weekStartDate = currentWeekStart();

  const { data: existing } = await supabase
    .from('weekly_plans')
    .select('*')
    .eq('business_id', businessId)
    .eq('week_start_date', weekStartDate)
    .maybeSingle();

  if (existing && existing.status === 'ready') {
    const { data: existingCards } = await supabase.from('video_cards').select('*').eq('weekly_plan_id', existing.id).order('day_of_week');
    return NextResponse.json({ ...existing, video_cards: existingCards ?? [] });
  }

  const { data: plan, error: planError } = await supabase
    .from('weekly_plans')
    .upsert({ business_id: businessId, week_start_date: weekStartDate, status: 'generating' }, { onConflict: 'business_id,week_start_date' })
    .select()
    .single();
  if (planError || !plan) return NextResponse.json({ error: planError?.message ?? 'Failed to start plan' }, { status: 500 });

  try {
    const cards = await generateWeeklyPlan(business as Business);

    await supabase.from('video_cards').delete().eq('weekly_plan_id', plan.id);
    const { error: cardsError } = await supabase.from('video_cards').insert(
      cards.map((c) => ({
        weekly_plan_id: plan.id,
        business_id: businessId,
        day_of_week: c.dayOfWeek,
        title: c.title,
        concept: c.concept,
        content_goal: c.contentGoal,
        status: 'pending_detail' as const,
      })),
    );
    if (cardsError) throw new Error(cardsError.message);

    const { data: finalPlan } = await supabase
      .from('weekly_plans')
      .update({ status: 'ready', generated_at: new Date().toISOString() })
      .eq('id', plan.id)
      .select()
      .single();

    const { data: finalCards } = await supabase.from('video_cards').select('*').eq('weekly_plan_id', plan.id).order('day_of_week');

    return NextResponse.json({ ...finalPlan, video_cards: finalCards ?? [] });
  } catch (err) {
    await supabase.from('weekly_plans').update({ status: 'failed' }).eq('id', plan.id);
    if (err instanceof AnthropicNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Generation failed' }, { status: 500 });
  }
}
