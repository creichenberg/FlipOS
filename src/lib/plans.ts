export type PlanTier = 'base' | 'pro';

export const PLAN_TIERS: Record<PlanTier, { label: string; price: number; videosPerWeek: number }> = {
  base: { label: 'Base', price: 15, videosPerWeek: 5 },
  pro: { label: 'Pro', price: 20, videosPerWeek: 10 },
};

// No active subscription (or an unrecognized one) falls back to the Base
// count rather than blocking generation outright - this app doesn't gate
// plan generation behind having a subscription at all yet, so this just
// keeps that existing behavior working while making the count tier-aware.
export const DEFAULT_TIER: PlanTier = 'base';

export function isPlanTier(value: unknown): value is PlanTier {
  return value === 'base' || value === 'pro';
}

export function priceIdToTier(priceId: string | null | undefined): PlanTier | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_ID_BASE) return 'base';
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return 'pro';
  return null;
}

export function tierToPriceId(tier: PlanTier): string | undefined {
  return tier === 'pro' ? process.env.STRIPE_PRICE_ID_PRO : process.env.STRIPE_PRICE_ID_BASE;
}
