'use client';

import { useRef, useState } from 'react';
import { Film, Mic, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

interface ClipUploadProps {
  businessId: string;
  videoCardId: string;
  targetId: string;
  targetKind: 'shot' | 'voiceover';
  initialFileName: string | null;
  onUploaded: (fileName: string) => void;
}

// Plain file input with `capture` set, rather than a custom in-browser
// camera/microphone capture - opens the phone's native camera or voice
// recorder directly and hands back a real file, which is far more reliable
// across iOS/Android than building and maintaining getUserMedia-based
// capture in the browser. Voiceover lines capture audio only, not video -
// there's no shot to frame, just a line to read.
export function ClipUpload({ businessId, videoCardId, targetId, targetKind, initialFileName, onUploaded }: ClipUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(initialFileName);
  const isAudio = targetKind === 'voiceover';

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${businessId}/${videoCardId}/${targetId}-${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage.from('clips').upload(path, file, {
        contentType: file.type,
      });
      if (uploadError) throw new Error(uploadError.message);

      const { error: insertError } = await supabase.from('media_uploads').insert({
        video_card_id: videoCardId,
        business_id: businessId,
        shot_id: targetKind === 'shot' ? targetId : null,
        voiceover_line_id: targetKind === 'voiceover' ? targetId : null,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (insertError) throw new Error(insertError.message);

      setFileName(file.name);
      onUploaded(file.name);
      toast.success(isAudio ? 'Recording uploaded' : 'Clip uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={isAudio ? 'audio/*' : 'video/*'}
        capture={isAudio ? true : 'environment'}
        className="hidden"
        onChange={handleFile}
      />
      <Button type="button" variant="outline" className="w-full" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? (
          'Uploading…'
        ) : fileName ? (
          <>
            <Check className="h-3.5 w-3.5" />
            {isAudio ? 'Replace recording' : 'Replace clip'}
          </>
        ) : (
          <>
            <Upload className="h-3.5 w-3.5" />
            {isAudio ? 'Record or upload audio' : 'Film or upload a clip'}
          </>
        )}
      </Button>
      {fileName && (
        <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-text-secondary">
          {isAudio ? <Mic className="h-3 w-3" /> : <Film className="h-3 w-3" />}
          {fileName}
        </p>
      )}
    </div>
  );
}
