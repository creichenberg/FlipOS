import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonShotList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex gap-4 border-b border-border-subtle py-4 last:border-b-0">
          <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
