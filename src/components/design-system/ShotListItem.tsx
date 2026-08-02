import { Camera } from 'lucide-react';
import type { Shot } from '@/lib/types/database';

export function ShotListItem({ shot }: { shot: Shot }) {
  return (
    <div className="flex gap-4 border-b border-border-subtle py-4 last:border-b-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-medium text-primary">
        {shot.shot_number}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">{shot.description}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1">
            <Camera className="h-3.5 w-3.5" />
            {shot.camera_angle}
          </span>
          <span>{shot.shot_type}</span>
          <span>{shot.duration_seconds}s</span>
        </div>
      </div>
    </div>
  );
}
