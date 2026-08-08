'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

// Catches errors anywhere in the App Router tree that escape a route's own
// error.tsx (if any). Sentry.captureException is a no-op without a
// configured NEXT_PUBLIC_SENTRY_DSN (see src/instrumentation-client.ts), so
// this is safe to ship unconditionally.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
