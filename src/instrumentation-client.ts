import * as Sentry from '@sentry/nextjs';

// Optional, same pattern as CREATOMATE_API_KEY elsewhere in this app: unset
// in local dev and CI, so nothing is ever reported unless a real project DSN
// is configured. A Sentry DSN isn't a secret (it's meant to ship in a public
// client bundle, same as a Stripe publishable key), so one NEXT_PUBLIC_
// var covers the client, server, and edge configs.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
