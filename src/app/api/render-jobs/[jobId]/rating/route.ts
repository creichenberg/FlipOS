import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FEEDBACK_LENGTH = 2000;

// One rating per render job - thumbs up/down, plus optional freeform
// feedback (only really meant to accompany a thumbs-down, but nothing here
// enforces that beyond the UI, since a "why" on a thumbs-up is harmless).
// Every call fully replaces the row (rating + feedback together) rather
// than patching individual fields, so switching from down-with-feedback
// back to up also clears the now-stale feedback text.
export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: job } = await supabase.from('render_jobs').select('id, status, video_card_id, business_id').eq('id', jobId).maybeSingle();
  if (!job) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  const { data: business } = await supabase.from('businesses').select('user_id').eq('id', job.business_id).maybeSingle();
  if (!business || business.user_id !== user.id) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  if (job.status !== 'complete') {
    return NextResponse.json({ error: 'Only a finished video can be rated' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const rating = body?.rating;
  if (rating !== 'up' && rating !== 'down') {
    return NextResponse.json({ error: 'rating must be "up" or "down"' }, { status: 400 });
  }
  const feedback = typeof body?.feedback === 'string' && body.feedback.trim() ? body.feedback.trim().slice(0, MAX_FEEDBACK_LENGTH) : null;

  const { data: saved, error } = await supabase
    .from('video_ratings')
    .upsert(
      { render_job_id: jobId, video_card_id: job.video_card_id, business_id: job.business_id, rating, feedback },
      { onConflict: 'render_job_id' },
    )
    .select('rating, feedback')
    .single();
  if (error || !saved) return NextResponse.json({ error: error?.message ?? 'Failed to save rating' }, { status: 500 });

  return NextResponse.json({ rating: saved });
}
