import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRenderProvider, type RenderRecipe } from '@/lib/video/render';
import { buildRenderRecipe, missingClipCounts } from '@/lib/video/recipeBuilder';
import { assertNotRateLimited, RateLimitError, RATE_LIMITED_ACTIONS } from '@/lib/rateLimit';
import type { MediaUpload, RenderJob, Shot, VideoCard, VoiceoverLine } from '@/lib/types/database';

// Attaches this job's rating (if any) so the client can show the thumbs
// up/down control's saved state without a second round trip. A freshly
// created job (from POST below) never has one yet, so this is only used on
// the GET path.
async function withRating(supabase: Awaited<ReturnType<typeof createClient>>, job: RenderJob) {
  const { data: rating } = await supabase.from('video_ratings').select('rating, feedback').eq('render_job_id', job.id).maybeSingle();
  return { ...job, rating: rating ?? null };
}

async function loadCardContext(supabase: Awaited<ReturnType<typeof createClient>>, cardId: string, userId: string) {
  const { data: card } = await supabase.from('video_cards').select('*').eq('id', cardId).maybeSingle();
  const { data: business } = card ? await supabase.from('businesses').select('user_id').eq('id', card.business_id).maybeSingle() : { data: null };
  if (!card || !business || business.user_id !== userId) return null;

  const [{ data: shots }, { data: voiceoverLines }, { data: uploads }] = await Promise.all([
    supabase.from('shots').select('*').eq('video_card_id', cardId).order('order_index'),
    supabase.from('voiceover_lines').select('*').eq('video_card_id', cardId).order('order_index'),
    supabase.from('media_uploads').select('*').eq('video_card_id', cardId),
  ]);

  return {
    card: card as VideoCard,
    shots: (shots as Shot[]) ?? [],
    voiceoverLines: (voiceoverLines as VoiceoverLine[]) ?? [],
    uploads: (uploads as MediaUpload[]) ?? [],
  };
}

export async function POST(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const context = await loadCardContext(supabase, cardId, user.id);
  if (!context) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  const { card, shots, voiceoverLines, uploads } = context;

  if (shots.length === 0 && voiceoverLines.length === 0) {
    return NextResponse.json({ error: 'Generate the shot list before creating a video' }, { status: 400 });
  }

  const missing = missingClipCounts(shots, voiceoverLines, uploads);
  if (missing.shots > 0 || missing.voiceover > 0) {
    return NextResponse.json(
      { error: `Upload every clip in Filming Mode first - ${missing.shots} shot(s) and ${missing.voiceover} line(s) still need one.` },
      { status: 400 },
    );
  }

  // Every submission spends real render-provider credits (a finite trial
  // balance, then real money) - throttle submissions, not the GET status
  // polling below, which never triggers a new render.
  try {
    await assertNotRateLimited(supabase, user.id, RATE_LIMITED_ACTIONS.renderSubmit, { maxCalls: 5, windowMinutes: 15 });
  } catch (err) {
    if (err instanceof RateLimitError) return NextResponse.json({ error: err.message }, { status: 429 });
    throw err;
  }

  const recipe = buildRenderRecipe(card, shots, voiceoverLines, uploads);
  const provider = getRenderProvider();

  const { data: job, error: insertError } = await supabase
    .from('render_jobs')
    .insert({
      video_card_id: cardId,
      business_id: card.business_id,
      provider: provider.name,
      status: 'queued',
      recipe: recipe as unknown as Record<string, unknown>,
    })
    .select()
    .single();
  if (insertError || !job) return NextResponse.json({ error: insertError?.message ?? 'Failed to start render' }, { status: 500 });

  try {
    const { providerJobId } = await provider.submitRenderJob(recipe);
    const { data: updated } = await supabase
      .from('render_jobs')
      .update({ status: 'rendering', provider_job_id: providerJobId, updated_at: new Date().toISOString() })
      .eq('id', job.id)
      .select()
      .single();
    return NextResponse.json(updated ?? job);
  } catch (err) {
    await supabase
      .from('render_jobs')
      .update({ status: 'failed', error_message: err instanceof Error ? err.message : 'Render failed to start', updated_at: new Date().toISOString() })
      .eq('id', job.id);
    return NextResponse.json({ error: 'Failed to start render' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: job } = await supabase
    .from('render_jobs')
    .select('*')
    .eq('video_card_id', cardId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!job) return NextResponse.json({ job: null });

  // Verify ownership via the business row rather than trusting cardId alone.
  const { data: business } = await supabase.from('businesses').select('user_id').eq('id', job.business_id).maybeSingle();
  if (!business || business.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (job.status === 'complete' || job.status === 'failed' || !job.provider_job_id) {
    return NextResponse.json({ job: await withRating(supabase, job as RenderJob) });
  }

  const provider = getRenderProvider();
  const result = await provider.getStatus(job.provider_job_id, job.recipe as unknown as RenderRecipe, job.created_at);

  if (result.status === job.status && !result.videoUrl && !result.errorMessage) {
    return NextResponse.json({ job: await withRating(supabase, job as RenderJob) });
  }

  const { data: updated } = await supabase
    .from('render_jobs')
    .update({
      status: result.status,
      video_url: result.videoUrl ?? null,
      error_message: result.errorMessage ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id)
    .select()
    .single();

  return NextResponse.json({ job: await withRating(supabase, (updated ?? job) as RenderJob) });
}
