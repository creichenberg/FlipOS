import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Camera, ArrowRight } from 'lucide-react';
import { requireBusiness } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/design-system/PageHeader';
import { ShotListItem } from '@/components/design-system/ShotListItem';
import { CopyButton } from '@/components/design-system/CopyButton';
import { DetailGenerator } from '@/components/features/video-detail/DetailGenerator';
import { RenderVideoPanel } from '@/components/features/video-detail/RenderVideoPanel';
import { RegenerateCardButton } from '@/components/features/video-detail/RegenerateCardButton';
import { Button } from '@/components/ui/button';
import { DAY_LABELS } from '@/lib/week';
import { missingClipCounts } from '@/lib/video/recipeBuilder';
import type { MediaUpload, RenderJob, Shot, VoiceoverLine } from '@/lib/types/database';

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
        <PageHeader
          title={card.title}
          description={`${DAY_LABELS[card.day_of_week]} · ${card.concept}`}
          actions={<RegenerateCardButton cardId={cardId} hasProgress={false} />}
        />
        <DetailGenerator cardId={cardId} />
      </div>
    );
  }

  const { data: shots } = await supabase.from('shots').select('*').eq('video_card_id', cardId).order('order_index');
  const { data: voiceoverLines } = await supabase.from('voiceover_lines').select('*').eq('video_card_id', cardId).order('order_index');
  const { data: uploads } = await supabase.from('media_uploads').select('*').eq('video_card_id', cardId);
  const { data: latestRenderJob } = await supabase
    .from('render_jobs')
    .select('*')
    .eq('video_card_id', cardId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const missing = missingClipCounts((shots as Shot[]) ?? [], (voiceoverLines as VoiceoverLine[]) ?? [], (uploads as MediaUpload[]) ?? []);
  const canRender = missing.shots === 0 && missing.voiceover === 0;
  const missingSummary =
    missing.shots > 0 || missing.voiceover > 0
      ? `Upload every clip in Filming Mode first - ${missing.shots} shot(s) and ${missing.voiceover} line(s) still need one.`
      : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={card.title}
        description={`${DAY_LABELS[card.day_of_week]} · ${card.concept}`}
        actions={<RegenerateCardButton cardId={cardId} hasProgress={true} />}
      />

      <Link
        href={`/cards/${cardId}/film`}
        className="hover-lift group flex flex-col items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center shadow-[0_16px_36px_-24px_color-mix(in_oklch,var(--primary)_60%,transparent)] sm:flex-row sm:justify-between sm:text-left"
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Camera className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Ready to film?</h2>
            <p className="text-sm text-text-secondary">
              A guided, step-by-step flow walks you through every shot and line - then we&apos;ll auto-edit your clips
              into a finished video with captions.
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="w-full shrink-0 sm:w-auto" tabIndex={-1}>
          <span>
            Start filming
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Button>
      </Link>

      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <div className="flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Hook · first 3 seconds
        </div>
        <p className="mt-2 text-lg leading-snug">{detail.hook}</p>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border-subtle bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-text-secondary">Script</h2>
            <CopyButton text={detail.script} />
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{detail.script}</p>
        </section>
        <section className="rounded-lg border border-border-subtle bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-text-secondary">Voiceover script</h2>
            <CopyButton text={detail.voiceover_script} />
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{detail.voiceover_script}</p>
        </section>
      </div>

      <section className="rounded-lg border border-border-subtle bg-surface p-6">
        <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-text-secondary">Shot list</h2>
        <div className="mt-2">
          {((shots as Shot[] | null) ?? []).map((shot) => (
            <ShotListItem key={shot.id} shot={shot} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border-subtle bg-surface p-6">
        <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-text-secondary">Voiceover lines</h2>
        <ol className="mt-3 space-y-2">
          {((voiceoverLines as VoiceoverLine[] | null) ?? []).map((line) => (
            <li key={line.id} className="text-sm text-text-secondary">
              <span className="font-medium text-foreground">{line.line_number}.</span> {line.text}
            </li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {detail.on_screen_text.length > 0 && (
          <section className="rounded-lg border border-dashed border-border-subtle p-6">
            <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-text-secondary">On-screen text</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {detail.on_screen_text.map((t: string, i: number) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-lg border border-dashed border-border-subtle p-6">
          <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-text-secondary">Editing suggestions</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{detail.editing_suggestions}</p>
        </section>
      </div>

      <section className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-text-secondary">Ready to post</h2>
          <CopyButton
            text={`${detail.caption}\n\n${detail.hashtags.map((t: string) => `#${t.replace(/^#/, '')}`).join(' ')}`}
          />
        </div>
        <p className="mt-2 text-sm leading-relaxed">{detail.caption}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {detail.hashtags.map((tag: string) => (
            <span key={tag} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              #{tag.replace(/^#/, '')}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm font-medium">{detail.call_to_action}</p>
      </section>

      <RenderVideoPanel
        cardId={cardId}
        canRender={canRender}
        missingSummary={missingSummary}
        initialJob={latestRenderJob as RenderJob | null}
        defaultProviderIsMock={!process.env.CREATOMATE_API_KEY}
      />
    </div>
  );
}
