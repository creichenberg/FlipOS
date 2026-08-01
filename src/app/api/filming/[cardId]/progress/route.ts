import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { filmingSessionId, type, itemId, isComplete } = body as {
    filmingSessionId: string;
    type: 'shot' | 'voiceover';
    itemId: string;
    isComplete: boolean;
  };

  const { data: session } = await supabase.from('filming_sessions').select('*').eq('id', filmingSessionId).maybeSingle();
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: business } = await supabase.from('businesses').select('user_id').eq('id', session.business_id).maybeSingle();
  if (!business || business.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const completedAt = isComplete ? new Date().toISOString() : null;

  if (type === 'shot') {
    await supabase
      .from('shot_progress')
      .upsert({ filming_session_id: filmingSessionId, shot_id: itemId, is_complete: isComplete, completed_at: completedAt }, { onConflict: 'filming_session_id,shot_id' });
  } else {
    await supabase
      .from('voiceover_progress')
      .upsert(
        { filming_session_id: filmingSessionId, voiceover_line_id: itemId, is_complete: isComplete, completed_at: completedAt },
        { onConflict: 'filming_session_id,voiceover_line_id' },
      );
  }

  const [{ count: totalShots }, { count: doneShots }, { count: totalLines }, { count: doneLines }] = await Promise.all([
    supabase.from('shots').select('id', { count: 'exact', head: true }).eq('video_card_id', cardId),
    supabase.from('shot_progress').select('id', { count: 'exact', head: true }).eq('filming_session_id', filmingSessionId).eq('is_complete', true),
    supabase.from('voiceover_lines').select('id', { count: 'exact', head: true }).eq('video_card_id', cardId),
    supabase.from('voiceover_progress').select('id', { count: 'exact', head: true }).eq('filming_session_id', filmingSessionId).eq('is_complete', true),
  ]);

  const allDone = (totalShots ?? 0) === (doneShots ?? 0) && (totalLines ?? 0) === (doneLines ?? 0);
  if (allDone) {
    await supabase.from('filming_sessions').update({ status: 'complete', completed_at: new Date().toISOString() }).eq('id', filmingSessionId);
    await supabase.from('video_cards').update({ status: 'complete' }).eq('id', cardId);
  }

  return NextResponse.json({ ok: true, allDone });
}
