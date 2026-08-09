import type { Business, MediaUpload, Shot, VideoCard, VoiceoverLine } from '@/lib/types/database';
import type { RenderRecipe } from './render';

function latestUploadFor(uploads: MediaUpload[], predicate: (u: MediaUpload) => boolean): MediaUpload | undefined {
  return uploads.filter(predicate).sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))[0];
}

// How many shots/voiceover lines still don't have an uploaded clip -
// rendering needs every one of them, since there's no music/B-roll filler
// to paper over a gap.
export function missingClipCounts(
  shots: Shot[],
  voiceoverLines: VoiceoverLine[],
  uploads: MediaUpload[],
): { shots: number; voiceover: number } {
  const uploadedShotIds = new Set(uploads.filter((u) => u.shot_id).map((u) => u.shot_id));
  const uploadedLineIds = new Set(uploads.filter((u) => u.voiceover_line_id).map((u) => u.voiceover_line_id));
  return {
    shots: shots.filter((s) => !uploadedShotIds.has(s.id)).length,
    voiceover: voiceoverLines.filter((l) => !uploadedLineIds.has(l.id)).length,
  };
}

// Assembles the provider-agnostic render recipe: shots in shot order for
// the visual track, voiceover lines in line order for captions (the exact
// scripted text, not a transcription guess - see the caption note in
// CLAUDE.md). No music field - skipped for now.
export function buildRenderRecipe(
  card: VideoCard,
  shots: Shot[],
  voiceoverLines: VoiceoverLine[],
  uploads: MediaUpload[],
  business: Pick<Business, 'caption_style' | 'edit_style'>,
): RenderRecipe {
  const clips = shots
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .flatMap((shot) => {
      const upload = latestUploadFor(uploads, (u) => u.shot_id === shot.id);
      if (!upload) return [];
      return [{ shotId: shot.id, shotNumber: shot.shot_number, storagePath: upload.storage_path, durationSeconds: shot.duration_seconds }];
    });

  const captions = voiceoverLines
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .flatMap((line) => {
      const upload = latestUploadFor(uploads, (u) => u.voiceover_line_id === line.id);
      if (!upload) return [];
      return [{ voiceoverLineId: line.id, lineNumber: line.line_number, text: line.text, storagePath: upload.storage_path }];
    });

  return {
    videoCardId: card.id,
    businessId: card.business_id,
    aspectRatio: '9:16',
    captionStyle: business.caption_style,
    editStyle: business.edit_style,
    clips,
    captions,
  };
}
