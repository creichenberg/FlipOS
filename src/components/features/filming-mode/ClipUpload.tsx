'use client';

import { useRef, useState } from 'react';
import { Film, Upload, Check } from 'lucide-react';
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
// camera - opens the phone's native camera app directly and hands back a
// real video file, which is far more reliable across iOS/Android than
// building and maintaining getUserMedia-based capture in the browser.
export function ClipUpload({ businessId, videoCardId, targetId, targetKind, initialFileName, onUploaded }: ClipUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(initialFileName);

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
      toast.success('Clip uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={handleFile} />
      <Button type="button" variant="outline" className="w-full" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? (
          'Uploading…'
        ) : fileName ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Replace clip
          </>
        ) : (
          <>
            <Upload className="h-3.5 w-3.5" />
            Film or upload a clip
          </>
        )}
      </Button>
      {fileName && (
        <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-text-secondary">
          <Film className="h-3 w-3" />
          {fileName}
        </p>
      )}
    </div>
  );
}
