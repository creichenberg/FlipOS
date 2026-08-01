import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient, StripeNotConfiguredError } from '@/lib/stripe/client';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) return NextResponse.json({ error: 'Billing is not configured. Set STRIPE_PRICE_ID.' }, { status: 503 });

  try {
    const stripe = getStripeClient();
    const origin = new URL(request.url).origin;

    const { data: existingSub } = await supabase.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: existingSub?.stripe_customer_id ?? undefined,
      customer_email: existingSub?.stripe_customer_id ? undefined : (user.email ?? undefined),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?checkout=success`,
      cancel_url: `${origin}/billing?checkout=cancelled`,
      client_reference_id: user.id,
      subscription_data: { metadata: { user_id: user.id } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) return NextResponse.json({ error: err.message }, { status: 503 });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Checkout failed' }, { status: 500 });
  }
}
