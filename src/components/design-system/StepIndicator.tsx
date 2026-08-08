// `activeColor` controls the currently-active segment's pulsing overlay -
// 'primary' (default, used by Filming Mode) matches the app's usual accent;
// 'emerald' keeps the whole bar strictly grey-to-green (onboarding's own
// request), so the in-progress step reads as a lighter green rather than
// introducing the blue accent into an otherwise all-green indicator.
export function StepIndicator({
  current,
  total,
  activeColor = 'primary',
}: {
  current: number;
  total: number;
  activeColor?: 'primary' | 'emerald';
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <div key={i} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle">
            <div
              className="absolute inset-y-0 left-0 h-full w-full origin-left rounded-full bg-emerald-500 transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: isDone ? 'scaleX(1)' : 'scaleX(0)' }}
            />
            {isActive && (
              <div
                className={`absolute inset-0 animate-pulse rounded-full motion-reduce:animate-none ${
                  activeColor === 'emerald' ? 'bg-emerald-500/40' : 'bg-primary/40'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
