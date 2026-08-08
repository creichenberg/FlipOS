import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

export class RateLimitError extends Error {
  constructor() {
    super('Too many requests. Please wait a few minutes and try again.');
    this.name = 'RateLimitError';
  }
}

// Named actions for the four routes that hit a real paid API - kept here so
// a route and any future caller can't typo the action string differently.
export const RATE_LIMITED_ACTIONS = {
  planGenerate: 'plan_generate',
  cardDetailGenerate: 'card_detail_generate',
  cardRegenerate: 'card_regenerate',
  renderSubmit: 'render_submit',
} as const;

// Backed by the rate_limit_events table (supabase/migrations/0006_rate_limit_events.sql)
// rather than an in-memory counter, which wouldn't be reliable across
// separate serverless function instances. Throws RateLimitError (callers
// should map that to a 429) if the user has already made `maxCalls` calls
// for this action within the trailing `windowMinutes`; otherwise records
// this call and returns. Uses the caller's own session-scoped Supabase
// client, not the admin client - rate_limit_events' RLS policies let a user
// read/insert only their own rows, so no service-role dependency is needed
// on routes that otherwise never touch it.
export async function assertNotRateLimited(
  supabase: SupabaseClient<Database>,
  userId: string,
  action: (typeof RATE_LIMITED_ACTIONS)[keyof typeof RATE_LIMITED_ACTIONS],
  { maxCalls, windowMinutes }: { maxCalls: number; windowMinutes: number },
): Promise<void> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('rate_limit_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', since);

  if ((count ?? 0) >= maxCalls) {
    throw new RateLimitError();
  }

  await supabase.from('rate_limit_events').insert({ user_id: userId, action });
}
