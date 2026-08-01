import { requireBusiness } from '@/lib/session';
import { PageHeader } from '@/components/design-system/PageHeader';
import { EditBusinessForm } from '@/components/features/dashboard/EditBusinessForm';

export default async function SettingsPage() {
  const business = await requireBusiness();

  return (
    <div className="max-w-lg space-y-8">
      <PageHeader title="Settings" description="Your business profile - used to personalize every generated plan." />
      <EditBusinessForm business={business} />
    </div>
  );
}
