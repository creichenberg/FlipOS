const VARIANTS = {
  neutral: 'bg-secondary text-secondary-foreground',
  accent: 'bg-primary/10 text-primary',
} as const;

export function StatusBadge({ label, variant = 'neutral' }: { label: string; variant?: keyof typeof VARIANTS }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${VARIANTS[variant]}`}>{label}</span>
  );
}
