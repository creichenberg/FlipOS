import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Business } from '@/lib/types/database';

// Server Component / Route Handler helper. Middleware already redirects
// unauthenticated requests to /login before a page ever renders, so this
// throwing via redirect() here is a defense-in-depth backstop, not the
// primary gate.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireBusiness(): Promise<Business> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: business } = await supabase.from('businesses').select('*').eq('user_id', user.id).maybeSingle();
  if (!business) redirect('/onboarding');
  return business;
}
