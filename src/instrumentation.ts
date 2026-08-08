import * as Sentry from '@sentry/nextjs';

// Loads the right per-runtime Sentry config (see sentry.server.config.ts /
// sentry.edge.config.ts) - both are themselves no-ops when SENTRY_DSN isn't
// set, so this file works unconditionally in every environment, including
// local dev and CI, without needing its own env-var check.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
