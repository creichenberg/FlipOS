import { notFound, redirect } from 'next/navigation';
import { requireBusiness } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/design-system/PageHeader';
import { FilmingModeFlow } from '@/components/features/filming-mode/FilmingModeFlow';
import type { Shot, VoiceoverLine } from '@/lib/types/database';

export default async function FilmPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const business = await requireBusiness();
  const supabase = await createClient();

  const { data: card } = await supabase.from('video_cards').select('*').eq('id', cardId).maybeSingle();
  if (!card || card.business_id !== business.id) notFound();

  const { data: shots } = await supabase.from('shots').select('*').eq('video_card_id', cardId).order('order_index');
  const { data: voiceoverLines } = await supabase.from('voiceover_lines').select('*').eq('video_card_id', cardId).order('order_index');

  if (!shots || shots.length === 0) redirect(`/cards/${cardId}`);

  let { data: session } = await supabase
    .from('filming_sessions')
    .select('*')
    .eq('video_card_id', cardId)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .maybeSingle();

  if (!session) {
    const { data: newSession } = await supabase
      .from('filming_sessions')
      .insert({ video_card_id: cardId, business_id: business.id })
      .select()
      .single();
    session = newSession;
  }

  if (!session) throw new Error('Could not start a filming session.');

  const { data: shotProgress } = await supabase.from('shot_progress').select('shot_id').eq('filming_session_id', session.id).eq('is_complete', true);
  const { data: voiceoverProgress } = await supabase
    .from('voiceover_progress')
    .select('voiceover_line_id')
    .eq('filming_session_id', session.id)
    .eq('is_complete', true);

  const initialDone = [
    ...(shotProgress ?? []).map((p) => p.shot_id),
    ...(voiceoverProgress ?? []).map((p) => p.voiceover_line_id),
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Filming mode" description={card.title} />
      <FilmingModeFlow
        cardId={cardId}
        filmingSessionId={session.id}
        shots={(shots as Shot[]) ?? []}
        voiceoverLines={(voiceoverLines as VoiceoverLine[]) ?? []}
        initialDone={initialDone}
      />
    </div>
  );
}
