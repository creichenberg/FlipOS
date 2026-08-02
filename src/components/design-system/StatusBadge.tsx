const VARIANTS = {
  neutral: 'bg-secondary text-secondary-foreground',
  accent: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
} as const;

const DOT_VARIANTS: Partial<Record<keyof typeof VARIANTS, string>> = {
  success: 'bg-emerald-500',
};

export function StatusBadge({ label, variant = 'neutral' }: { label: string; variant?: keyof typeof VARIANTS }) {
  const dot = DOT_VARIANTS[variant];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${VARIANTS[variant]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {label}
    </span>
  );
}
