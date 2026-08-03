import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-blueprint-grid flex flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle px-6 py-16 text-center">
      <Icon className="h-7 w-7 text-primary" />
      <h3 className="mt-4 text-base font-medium">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
