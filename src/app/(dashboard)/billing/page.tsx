import { requireUser } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/design-system/PageHeader';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { BillingActions } from '@/components/features/dashboard/BillingActions';
import { TestTierSwitcher } from '@/components/features/dashboard/TestTierSwitcher';
import { PLAN_TIERS, isPlanTier } from '@/lib/plans';

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Trial',
  active: 'Active',
  past_due: 'Past due',
  canceled: 'Canceled',
  incomplete: 'Incomplete',
};

export default async function BillingPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: subscription } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const tier = isPlanTier(subscription?.plan_tier) ? subscription.plan_tier : null;

  return (
    <div className="max-w-lg space-y-8">
      <PageHeader title="Billing" description="Manage your Blueprint Studio subscription." />

      {process.env.MOCK_BILLING === 'true' && <TestTierSwitcher currentTier={tier} />}

      <div className="space-y-4 rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Plan</span>
          <span className="text-sm font-medium">{tier ? `${PLAN_TIERS[tier].label} - $${PLAN_TIERS[tier].price}/mo` : '—'}</span>
        </div>
        {tier && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Videos per week</span>
            <span className="text-sm">{PLAN_TIERS[tier].videosPerWeek}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Status</span>
          <StatusBadge
            label={subscription ? (STATUS_LABELS[subscription.status] ?? subscription.status) : 'No subscription'}
            variant={isActive ? 'accent' : 'neutral'}
          />
        </div>
        {subscription?.current_period_end && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {subscription.cancel_at_period_end ? 'Ends' : 'Renews'}
            </span>
            <span className="text-sm">{new Date(subscription.current_period_end).toLocaleDateString()}</span>
          </div>
        )}
        <BillingActions hasSubscription={!!subscription?.stripe_customer_id} />
      </div>
    </div>
  );
}
