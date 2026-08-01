import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

// Service-role client - bypasses RLS. Only for trusted server contexts that
// don't have a user session to scope by, e.g. the Stripe webhook writing
// subscription state on behalf of whichever user the event belongs to.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin client is not configured. Set SUPABASE_SERVICE_ROLE_KEY.');
  return createSupabaseClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
