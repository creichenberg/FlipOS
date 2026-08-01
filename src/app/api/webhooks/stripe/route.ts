import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlanTier, priceIdToTier } from '@/lib/plans';

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${err instanceof Error ? err.message : 'unknown'}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotency ledger - Stripe can deliver the same event more than once.
  const { error: insertError } = await supabase.from('stripe_events').insert({ stripe_event_id: event.id, type: event.type, payload: event as unknown as Record<string, unknown> });
  if (insertError) {
    // Unique violation on stripe_event_id means we've already processed this one.
    return NextResponse.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (userId && session.customer && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        await upsertSubscription(supabase, userId, subscription);
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.created':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (userId) await upsertSubscription(supabase, userId, subscription);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function upsertSubscription(supabase: ReturnType<typeof createAdminClient>, userId: string, subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  const metadataTier = subscription.metadata?.plan_tier;
  const tier = isPlanTier(metadataTier) ? metadataTier : priceIdToTier(item?.price?.id);

  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: subscription.status as 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete',
      plan_tier: tier,
      current_period_end: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}
