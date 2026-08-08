import * as Sentry from '@sentry/nextjs';

// Optional, same pattern as CREATOMATE_API_KEY - no-op without a real DSN,
// so local dev/CI never reports anything and never needs one configured.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
  });
}
