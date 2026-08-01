import Stripe from 'stripe';

export class StripeNotConfiguredError extends Error {
  constructor() {
    super('Billing is not configured. Set STRIPE_SECRET_KEY.');
    this.name = 'StripeNotConfiguredError';
  }
}

let cachedClient: Stripe | null | undefined;
export function getStripeClient(): Stripe {
  if (cachedClient === undefined) {
    cachedClient = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
  }
  if (!cachedClient) throw new StripeNotConfiguredError();
  return cachedClient;
}
