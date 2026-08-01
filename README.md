# Blueprint Studio

An AI social media manager for small businesses. See `CLAUDE.md` for architecture notes and known
gotchas, and `/root/.claude/plans/functional-plotting-seal.md` for the full design doc this was
built from.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in Supabase, Anthropic, and Stripe credentials.
3. Run `supabase/migrations/0001_init.sql` against your Supabase project.
4. `npm run dev` and open [http://localhost:3000](http://localhost:3000).

The app requires a configured Supabase project to run at all (auth/session middleware runs on every
request) - Anthropic and Stripe are checked lazily and degrade to a clear error only on the specific
actions that need them (generating a plan, checking out).

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - production build (also typechecks and lints)
- `npm run lint` - ESLint only
