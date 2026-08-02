export function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <div key={i} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle">
            <div
              className="absolute inset-y-0 left-0 h-full w-full origin-left rounded-full bg-primary transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: isDone ? 'scaleX(1)' : 'scaleX(0)' }}
            />
            {isActive && <div className="absolute inset-0 animate-pulse rounded-full bg-primary/40 motion-reduce:animate-none" />}
          </div>
        );
      })}
    </div>
  );
}
