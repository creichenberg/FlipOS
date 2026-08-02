'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Upload, Check } from 'lucide-react';
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

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Shots use a plain file input with `capture="environment"` - opens the
// phone's native camera app directly and hands back a real file, which is
// far more reliable across iOS/Android than a custom in-browser camera.
// Voiceover lines are different: the `capture` attribute for *audio* is
// unreliable across mobile browsers (notably iOS Safari has no real "record
// audio" capture handler and silently falls back to the camera regardless
// of `accept`), so those record in-browser via getUserMedia/MediaRecorder
// instead, with a plain file picker as a fallback for unsupported browsers.
export function ClipUpload({ businessId, videoCardId, targetId, targetKind, initialFileName, onUploaded }: ClipUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(initialFileName);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [supportsRecording, setSupportsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAudio = targetKind === 'voiceover';

  useEffect(() => {
    setSupportsRecording(
      typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined',
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function uploadFile(file: File) {
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

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await uploadFile(file);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        const mimeType = recorder.mimeType || 'audio/webm';
        const extension = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        void uploadFile(new File([blob], `voiceover-${Date.now()}.${extension}`, { type: mimeType }));
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      toast.error('Could not access the microphone - check your browser permissions, or upload a file instead.');
    }
  }

  function stopRecording() {
    setRecording(false);
    mediaRecorderRef.current?.stop();
  }

  if (isAudio) {
    return (
      <div>
        <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
        <div className="flex gap-2">
          {supportsRecording && (
            <Button
              type="button"
              variant={recording ? 'destructive' : 'outline'}
              className="flex-1"
              onClick={recording ? stopRecording : startRecording}
              disabled={uploading}
            >
              {recording ? (
                <>
                  <Square className="h-3.5 w-3.5" />
                  Stop · {formatSeconds(recordSeconds)}
                </>
              ) : uploading ? (
                'Uploading…'
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" />
                  {fileName ? 'Re-record' : 'Record'}
                </>
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className={supportsRecording ? 'flex-1' : 'w-full'}
            onClick={() => inputRef.current?.click()}
            disabled={uploading || recording}
          >
            <Upload className="h-3.5 w-3.5" />
            {fileName ? 'Replace' : 'Upload file'}
          </Button>
        </div>
      </div>
    );
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
    </div>
  );
}
