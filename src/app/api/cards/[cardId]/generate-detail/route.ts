import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateVideoDetail } from '@/lib/ai/generateVideoDetail';
import { AnthropicNotConfiguredError } from '@/lib/ai/client';
import type { Business, VideoCard } from '@/lib/types/database';

export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: card } = await supabase.from('video_cards').select('*').eq('id', cardId).maybeSingle();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const { data: business } = await supabase.from('businesses').select('*').eq('id', card.business_id).eq('user_id', user.id).maybeSingle();
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: existingDetail } = await supabase.from('video_details').select('*').eq('video_card_id', cardId).maybeSingle();
  if (existingDetail) {
    const { data: shots } = await supabase.from('shots').select('*').eq('video_card_id', cardId).order('order_index');
    const { data: voiceoverLines } = await supabase.from('voiceover_lines').select('*').eq('video_card_id', cardId).order('order_index');
    return NextResponse.json({ detail: existingDetail, shots, voiceoverLines });
  }

  try {
    const result = await generateVideoDetail(business as Business, card as VideoCard);

    const { data: detail, error: detailError } = await supabase
      .from('video_details')
      .insert({
        video_card_id: cardId,
        hook: result.hook,
        script: result.script,
        voiceover_script: result.voiceoverScript,
        on_screen_text: result.onScreenText,
        editing_suggestions: result.editingSuggestions,
        caption: result.caption,
        hashtags: result.hashtags,
        call_to_action: result.callToAction,
      })
      .select()
      .single();
    if (detailError) throw new Error(detailError.message);

    const { data: shots, error: shotsError } = await supabase
      .from('shots')
      .insert(
        result.shots.map((s, i) => ({
          video_card_id: cardId,
          shot_number: s.shotNumber,
          description: s.description,
          duration_seconds: s.durationSeconds,
          camera_angle: s.cameraAngle,
          shot_type: s.shotType,
          order_index: i,
        })),
      )
      .select();
    if (shotsError) throw new Error(shotsError.message);

    const { data: voiceoverLines, error: linesError } = await supabase
      .from('voiceover_lines')
      .insert(
        result.voiceoverLines.map((l, i) => ({
          video_card_id: cardId,
          line_number: l.lineNumber,
          text: l.text,
          order_index: i,
        })),
      )
      .select();
    if (linesError) throw new Error(linesError.message);

    await supabase.from('video_cards').update({ status: 'detail_ready' }).eq('id', cardId);

    return NextResponse.json({ detail, shots, voiceoverLines });
  } catch (err) {
    if (err instanceof AnthropicNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Generation failed' }, { status: 500 });
  }
}
