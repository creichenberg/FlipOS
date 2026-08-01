import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient, StripeNotConfiguredError } from '@/lib/stripe/client';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: sub } = await supabase.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
  if (!sub?.stripe_customer_id) return NextResponse.json({ error: 'No billing account found yet' }, { status: 400 });

  try {
    const stripe = getStripeClient();
    const origin = new URL(request.url).origin;
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) return NextResponse.json({ error: err.message }, { status: 503 });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not open billing portal' }, { status: 500 });
  }
}
