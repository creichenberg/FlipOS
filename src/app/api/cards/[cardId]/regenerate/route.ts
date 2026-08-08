import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { regenerateCardIdea } from '@/lib/ai/regenerateCardIdea';
import { AnthropicNotConfiguredError } from '@/lib/ai/client';
import { assertNotRateLimited, RateLimitError, RATE_LIMITED_ACTIONS } from '@/lib/rateLimit';
import type { Business, VideoCard } from '@/lib/types/database';

export const maxDuration = 30;

export async function POST(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: card } = await supabase.from('video_cards').select('*').eq('id', cardId).maybeSingle();
  if (!card) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  const { data: business } = await supabase.from('businesses').select('*').eq('id', card.business_id).eq('user_id', user.id).maybeSingle();
  if (!business) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  // Every call here is a real Claude call *and* destroys any existing
  // detail/shots/clips for the card (see the deletes below) - the single
  // most expensive and destructive action in this route set per call, so
  // it gets the tightest limit of the four.
  try {
    await assertNotRateLimited(supabase, user.id, RATE_LIMITED_ACTIONS.cardRegenerate, { maxCalls: 5, windowMinutes: 10 });
  } catch (err) {
    if (err instanceof RateLimitError) return NextResponse.json({ error: err.message }, { status: 429 });
    throw err;
  }

  const { data: siblingCards } = await supabase
    .from('video_cards')
    .select('title')
    .eq('weekly_plan_id', card.weekly_plan_id)
    .neq('id', cardId);
  const otherTitles = (siblingCards ?? []).map((c) => c.title);

  let idea;
  try {
    idea = await regenerateCardIdea(business as Business, card as VideoCard, otherTitles);
  } catch (err) {
    if (err instanceof AnthropicNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to regenerate idea' }, { status: 500 });
  }

  // Clean up any uploaded clip files in Storage before their DB rows cascade
  // away below - the rows disappearing doesn't delete the underlying blobs.
  const { data: uploads } = await supabase.from('media_uploads').select('storage_path').eq('video_card_id', cardId);
  if (uploads && uploads.length > 0) {
    await supabase.storage.from('clips').remove(uploads.map((u) => u.storage_path));
  }

  // Everything below hangs off the old idea and no longer applies once the
  // idea changes - video_details/shots/voiceover_lines/filming_sessions (and
  // its progress rows)/media_uploads cascade from these deletes; render_jobs
  // references the card directly, so it's deleted explicitly.
  await supabase.from('video_details').delete().eq('video_card_id', cardId);
  await supabase.from('shots').delete().eq('video_card_id', cardId);
  await supabase.from('voiceover_lines').delete().eq('video_card_id', cardId);
  await supabase.from('filming_sessions').delete().eq('video_card_id', cardId);
  await supabase.from('render_jobs').delete().eq('video_card_id', cardId);

  const { data: updated, error: updateError } = await supabase
    .from('video_cards')
    .update({ title: idea.title, concept: idea.concept, content_goal: idea.contentGoal, status: 'pending_detail' })
    .eq('id', cardId)
    .select()
    .single();
  if (updateError || !updated) return NextResponse.json({ error: updateError?.message ?? 'Failed to save new idea' }, { status: 500 });

  return NextResponse.json(updated);
}
