import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// The Sentry build plugin (source map upload, release tagging, etc.) is only
// wired in when a DSN is actually configured - same optionality pattern as
// CREATOMATE_API_KEY elsewhere in this app. Skipping the wrap entirely
// (rather than wrapping unconditionally with an empty org/project) means a
// local dev or CI build with no Sentry account never touches the plugin at
// all, so there's nothing to fail even without a SENTRY_AUTH_TOKEN.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
    })
  : nextConfig;
