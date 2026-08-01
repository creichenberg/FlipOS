import { requireBusiness } from '@/lib/session';
import { PageHeader } from '@/components/design-system/PageHeader';

export default async function SettingsPage() {
  const business = await requireBusiness();

  const rows: [string, string][] = [
    ['Business name', business.name],
    ['Industry', business.industry],
    ['Location', business.location],
    ['Website', business.website ?? '—'],
  ];

  return (
    <div className="max-w-lg space-y-8">
      <PageHeader title="Settings" description="Your business profile - used to personalize every generated plan." />

      <div className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-surface">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-text-secondary">{label}</span>
            <span className="text-sm font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
