export function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
            i < current ? 'bg-primary' : i === current ? 'bg-primary/40' : 'bg-border-subtle'
          }`}
        />
      ))}
    </div>
  );
}
