import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/design-system/PageHeader';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { PLAN_TIERS, SUBSCRIPTION_STATUS_LABELS, isPlanTier } from '@/lib/plans';
import { CREATOMATE_FREE_TRIAL_CREDITS, estimateRenderCredits } from '@/lib/video/credits';
import type { RenderRecipe } from '@/lib/video/render';

// Operator-only - see src/lib/admin.ts for the ADMIN_EMAILS gate and
// src/lib/supabase/middleware.ts for why /admin is exempt from the
// "must have a business" redirect every other authenticated page has.
// Reads across every business via the service-role client (createAdminClient)
// rather than the request-scoped client every other page in this app uses -
// this is the one page that's deliberately not RLS-scoped to a single user.
export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: businesses }, { data: subscriptions }, { data: ratings }, usersResult, { data: creatomateJobs }] = await Promise.all([
    admin.from('businesses').select('*').order('created_at', { ascending: false }),
    admin.from('subscriptions').select('*'),
    admin.from('video_ratings').select('*').order('created_at', { ascending: false }).limit(50),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    // Credits are spent per submission regardless of whether the render
    // later succeeds or fails, so every provider='creatomate' job counts -
    // see src/lib/video/credits.ts for why this is an estimate, not a real
    // balance read (Creatomate's API doesn't expose one).
    admin.from('render_jobs').select('recipe').eq('provider', 'creatomate'),
  ]);

  const emailByUserId = new Map((usersResult.data?.users ?? []).map((u) => [u.id, u.email ?? '—']));
  const subByUserId = new Map((subscriptions ?? []).map((s) => [s.user_id, s]));

  const rows = (businesses ?? []).map((business) => {
    const sub = subByUserId.get(business.user_id);
    const isActive = sub?.status === 'active' || sub?.status === 'trialing';
    const tier = isActive && isPlanTier(sub?.plan_tier) ? sub.plan_tier : null;
    return {
      business,
      email: emailByUserId.get(business.user_id) ?? '—',
      status: sub?.status,
      tier,
      price: tier ? PLAN_TIERS[tier].price : 0,
    };
  });

  const mrr = rows.reduce((sum, r) => sum + r.price, 0);
  const payingCount = rows.filter((r) => r.tier).length;

  const cardIds = [...new Set((ratings ?? []).map((r) => r.video_card_id))];
  const { data: cards } = cardIds.length > 0 ? await admin.from('video_cards').select('id, title, business_id').in('id', cardIds) : { data: [] };
  const cardById = new Map((cards ?? []).map((c) => [c.id, c]));
  const businessById = new Map((businesses ?? []).map((b) => [b.id, b]));

  const thumbsUpCount = (ratings ?? []).filter((r) => r.rating === 'up').length;
  const thumbsDownCount = (ratings ?? []).filter((r) => r.rating === 'down').length;

  const estimatedCredits = (creatomateJobs ?? []).reduce(
    (sum, job) => sum + estimateRenderCredits(job.recipe as unknown as RenderRecipe),
    0,
  );
  const onFreeTrial = estimatedCredits <= CREATOMATE_FREE_TRIAL_CREDITS;
  const creditsPercent = Math.min(100, Math.round((estimatedCredits / CREATOMATE_FREE_TRIAL_CREDITS) * 100));

  return (
    <div className="space-y-10">
      <PageHeader title="Admin" description="Every business on Blueprint Studio, their plan, and video feedback." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Businesses" value={String(rows.length)} />
        <StatCard label="Paying" value={String(payingCount)} />
        <StatCard label="MRR" value={`$${mrr}`} />
        <StatCard label="Video ratings" value={`${thumbsUpCount} up · ${thumbsDownCount} down`} />
      </div>

      {(creatomateJobs ?? []).length > 0 && (
        <section className="rounded-xl border border-border-subtle p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-secondary">Render credits (Creatomate)</h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="shrink-0 text-sm text-text-secondary">
              {onFreeTrial
                ? `~${estimatedCredits} of ${CREATOMATE_FREE_TRIAL_CREDITS} free trial credits used`
                : `~${estimatedCredits} credits used since going live`}
            </span>
            {onFreeTrial && <Progress value={creditsPercent} className="max-w-40" />}
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            Estimated from each render&apos;s actual output length at Creatomate&apos;s own documented rate (1 credit per
            100M pixels, assuming 30fps) - Creatomate&apos;s API has no endpoint for a real account balance, so this can
            drift slightly from the true number.
          </p>
        </section>
      )}

      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-text-secondary">Businesses</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-secondary">
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ business, email, status, tier, price }) => (
                <tr key={business.id} className="border-b border-border-subtle last:border-0">
                  <td className="px-4 py-3 font-medium">{business.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{business.owner_name}</td>
                  <td className="px-4 py-3 text-text-secondary">{email}</td>
                  <td className="px-4 py-3">{tier ? `${PLAN_TIERS[tier].label} · $${price}/mo` : '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={status ? (SUBSCRIPTION_STATUS_LABELS[status] ?? status) : 'No subscription'}
                      variant={status === 'active' || status === 'trialing' ? 'accent' : 'neutral'}
                    />
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(business.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    No businesses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-text-secondary">Recent video feedback</h2>
        <div className="mt-3 space-y-2">
          {(ratings ?? []).map((rating) => {
            const card = cardById.get(rating.video_card_id);
            const business = card ? businessById.get(card.business_id) : null;
            return (
              <div key={rating.id} className="flex items-start gap-3 rounded-lg border border-border-subtle p-4">
                {rating.rating === 'up' ? (
                  <ThumbsUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <ThumbsDown className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{business?.name ?? 'Unknown business'}</span>
                    <span className="text-text-secondary"> · {card?.title ?? 'a video'}</span>
                  </p>
                  {rating.feedback && <p className="mt-1 text-sm text-text-secondary">&quot;{rating.feedback}&quot;</p>}
                  <p className="mt-1 text-xs text-text-secondary">{new Date(rating.created_at).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
          {(ratings ?? []).length === 0 && (
            <p className="rounded-lg border border-dashed border-border-subtle p-6 text-center text-sm text-text-secondary">
              No video ratings yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle p-4">
      <p className="text-xs uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
