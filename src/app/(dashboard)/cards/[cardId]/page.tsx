import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireBusiness } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/design-system/PageHeader';
import { ShotListItem } from '@/components/design-system/ShotListItem';
import { CopyButton } from '@/components/design-system/CopyButton';
import { DetailGenerator } from '@/components/features/video-detail/DetailGenerator';
import { Button } from '@/components/ui/button';
import { DAY_LABELS } from '@/lib/week';
import type { Shot, VoiceoverLine } from '@/lib/types/database';

export default async function VideoCardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const business = await requireBusiness();
  const supabase = await createClient();

  const { data: card } = await supabase.from('video_cards').select('*').eq('id', cardId).maybeSingle();
  if (!card || card.business_id !== business.id) notFound();

  const { data: detail } = await supabase.from('video_details').select('*').eq('video_card_id', cardId).maybeSingle();

  if (!detail) {
    return (
      <div className="space-y-6">
        <PageHeader title={card.title} description={`${DAY_LABELS[card.day_of_week]} · ${card.concept}`} />
        <DetailGenerator cardId={cardId} />
      </div>
    );
  }

  const { data: shots } = await supabase.from('shots').select('*').eq('video_card_id', cardId).order('order_index');
  const { data: voiceoverLines } = await supabase.from('voiceover_lines').select('*').eq('video_card_id', cardId).order('order_index');

  return (
    <div className="space-y-8">
      <PageHeader
        title={card.title}
        description={`${DAY_LABELS[card.day_of_week]} · ${card.concept}`}
        actions={
          <Button asChild>
            <Link href={`/cards/${cardId}/film`}>Start filming</Link>
          </Button>
        }
      />

      <section className="rounded-lg border border-border-subtle bg-surface p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">Hook (first 3 seconds)</h2>
        <p className="mt-2 text-base">{detail.hook}</p>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border-subtle bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">Script</h2>
            <CopyButton text={detail.script} />
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{detail.script}</p>
        </section>
        <section className="rounded-lg border border-border-subtle bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">Voiceover script</h2>
            <CopyButton text={detail.voiceover_script} />
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{detail.voiceover_script}</p>
        </section>
      </div>

      <section className="rounded-lg border border-border-subtle bg-surface p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">Shot list</h2>
        <div className="mt-2">
          {((shots as Shot[] | null) ?? []).map((shot) => (
            <ShotListItem key={shot.id} shot={shot} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border-subtle bg-surface p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">Voiceover lines</h2>
        <ol className="mt-3 space-y-2">
          {((voiceoverLines as VoiceoverLine[] | null) ?? []).map((line) => (
            <li key={line.id} className="text-sm text-text-secondary">
              <span className="font-medium text-foreground">{line.line_number}.</span> {line.text}
            </li>
          ))}
        </ol>
      </section>

      {detail.on_screen_text.length > 0 && (
        <section className="rounded-lg border border-border-subtle bg-surface p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">On-screen text</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
            {detail.on_screen_text.map((t: string, i: number) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-border-subtle bg-surface p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">Editing suggestions</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{detail.editing_suggestions}</p>
      </section>

      <section className="rounded-lg border border-border-subtle bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">Caption &amp; hashtags</h2>
          <CopyButton
            text={`${detail.caption}\n\n${detail.hashtags.map((t: string) => `#${t.replace(/^#/, '')}`).join(' ')}`}
          />
        </div>
        <p className="mt-2 text-sm leading-relaxed">{detail.caption}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {detail.hashtags.map((tag: string) => (
            <span key={tag} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              #{tag.replace(/^#/, '')}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm font-medium">{detail.call_to_action}</p>
      </section>
    </div>
  );
}
