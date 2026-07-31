import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Temporary diagnostic route - reports whether the running deployment sees
// each required env var, and which commit/environment it's actually
// running, without exposing any secret values. Delete once setup is
// confirmed working; this is not meant to ship long-term.
export async function GET() {
  return NextResponse.json({
    deployment: {
      vercelEnv: process.env.VERCEL_ENV ?? null,
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    },
    envVarsPresent: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
      EBAY_CLIENT_ID: Boolean(process.env.EBAY_CLIENT_ID),
      EBAY_CLIENT_SECRET: Boolean(process.env.EBAY_CLIENT_SECRET),
      RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
      CRON_SECRET: Boolean(process.env.CRON_SECRET),
    },
  });
}
