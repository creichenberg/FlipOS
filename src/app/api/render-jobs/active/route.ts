import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Lets RenderNotifications.tsx discover in-progress renders on mount/poll
// without needing to already know a card id - the per-card render route
// only answers "what's the status of this one card's render," which isn't
// enough for a cross-page notifier that should pick up a render regardless
// of which page started it or whether the tab was refreshed since.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: business } = await supabase.from('businesses').select('id').eq('user_id', user.id).maybeSingle();
  if (!business) return NextResponse.json({ jobs: [] });

  const { data: jobs } = await supabase
    .from('render_jobs')
    .select('*')
    .eq('business_id', business.id)
    .in('status', ['queued', 'rendering']);
  if (!jobs || jobs.length === 0) return NextResponse.json({ jobs: [] });

  const { data: cards } = await supabase
    .from('video_cards')
    .select('id, title')
    .in(
      'id',
      jobs.map((j) => j.video_card_id),
    );
  const titleById = new Map((cards ?? []).map((c) => [c.id, c.title]));

  return NextResponse.json({
    jobs: jobs.map((j) => ({ videoCardId: j.video_card_id, cardTitle: titleById.get(j.video_card_id) ?? 'your video' })),
  });
}
