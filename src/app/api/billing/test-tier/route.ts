import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlanTier } from '@/lib/plans';

// Zero-cost way to test tier enforcement without a real Stripe subscription -
// see .env.example. Writes directly to `subscriptions`, which normal users
// can't do themselves (no insert/update RLS policy - only the service role
// can write there, same as the Stripe webhook). Gated behind MOCK_BILLING so
// this "grant myself a paid tier for free" endpoint is inert unless the site
// owner explicitly turns it on. Never enable this on a deploy with real
// paying customers.
export async function POST(request: Request) {
  if (process.env.MOCK_BILLING !== 'true') {
    return NextResponse.json({ error: 'Test billing is not enabled' }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  if (body?.clear === true) {
    const admin = createAdminClient();
    const { error } = await admin.from('subscriptions').delete().eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, plan: null });
  }

  if (!isPlanTier(body?.plan)) {
    return NextResponse.json({ error: 'A plan (base or pro) is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('subscriptions').upsert(
    {
      user_id: user.id,
      status: 'active',
      plan_tier: body.plan,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, plan: body.plan });
}
