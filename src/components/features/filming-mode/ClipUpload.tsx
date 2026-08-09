'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { estimateSpeechSeconds, PACING_TOLERANCE } from '@/lib/video/pacing';

interface ClipUploadProps {
  businessId: string;
  videoCardId: string;
  targetId: string;
  targetKind: 'shot' | 'voiceover';
  // The voiceover line's exact script text - only relevant for that kind,
  // used to estimate a target recording length (see src/lib/video/pacing.ts).
  text?: string;
  initialFileName: string | null;
  onUploaded: (fileName: string) => void;
}

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

interface PendingTake {
  blob: Blob;
  mimeType: string;
  actualSeconds: number;
}

// Shots use a plain file input with `capture="environment"` - opens the
// phone's native camera app directly and hands back a real file, which is
// far more reliable across iOS/Android than a custom in-browser camera.
// Voiceover lines are different: the `capture` attribute for *audio* is
// unreliable across mobile browsers (notably iOS Safari has no real "record
// audio" capture handler and silently falls back to the camera regardless
// of `accept`), so those record in-browser via getUserMedia/MediaRecorder
// instead, with a plain file picker as a fallback for unsupported browsers.
export function ClipUpload({ businessId, videoCardId, targetId, targetKind, text, initialFileName, onUploaded }: ClipUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(initialFileName);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [supportsRecording, setSupportsRecording] = useState(false);
  // A finished take held back from upload because it drifted too far from
  // the pacing target - the person picks retake or use-anyway before it
  // goes anywhere. Stays null (upload happens immediately, same as before)
  // whenever there's no target to check against or the take was close enough.
  const [pendingTake, setPendingTake] = useState<PendingTake | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // recorder.onstop is defined once per recording and needs the *final*
  // elapsed seconds - recordSeconds state itself is stale inside that
  // closure, so the timer interval mirrors it into a ref as it counts.
  const recordSecondsRef = useRef(0);
  const isAudio = targetKind === 'voiceover';
  const targetSeconds = isAudio && text ? estimateSpeechSeconds(text) : null;

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

  function uploadTake(take: PendingTake) {
    const extension = take.mimeType.includes('mp4') || take.mimeType.includes('m4a') ? 'm4a' : 'webm';
    void uploadFile(new File([take.blob], `voiceover-${Date.now()}.${extension}`, { type: take.mimeType }));
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
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const take: PendingTake = { blob, mimeType, actualSeconds: recordSecondsRef.current };
        const offTarget = targetSeconds != null && Math.abs(take.actualSeconds - targetSeconds) > targetSeconds * PACING_TOLERANCE;
        if (offTarget) {
          setPendingTake(take);
        } else {
          uploadTake(take);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      recordSecondsRef.current = 0;
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          const next = s + 1;
          recordSecondsRef.current = next;
          return next;
        });
      }, 1000);
    } catch {
      toast.error('Could not access the microphone - check your browser permissions, or upload a file instead.');
    }
  }

  function stopRecording() {
    setRecording(false);
    mediaRecorderRef.current?.stop();
  }

  function retake() {
    setPendingTake(null);
    void startRecording();
  }

  function useTakeAnyway() {
    if (!pendingTake) return;
    uploadTake(pendingTake);
    setPendingTake(null);
  }

  if (isAudio) {
    if (pendingTake && targetSeconds != null) {
      const tooFast = pendingTake.actualSeconds < targetSeconds;
      return (
        <div className="space-y-2 text-left">
          <p className="text-xs text-text-secondary">
            That took {formatSeconds(pendingTake.actualSeconds)} - aiming for about {formatSeconds(targetSeconds)}. Try reading it a
            little {tooFast ? 'slower' : 'faster'} so the captions line up better, or use this take anyway.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={retake}>
              Record again
            </Button>
            <Button type="button" className="flex-1" onClick={useTakeAnyway}>
              Use this anyway
            </Button>
          </div>
        </div>
      );
    }

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
        {targetSeconds != null && !recording && !uploading && (
          <p className="mt-2 text-xs text-text-secondary">Aim for about {formatSeconds(targetSeconds)}.</p>
        )}
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
