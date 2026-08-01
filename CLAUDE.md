# Blueprint Studio

AI social media manager for small businesses. Weekly, a business gets a batch of personalized
short-form video ideas (5/week on the Base plan, 10/week on Pro - see `src/lib/plans.ts`); opening
one generates a full shot list, script, and captions; a guided Filming Mode walks the owner through
recording it. See `/root/.claude/plans/functional-plotting-seal.md` for the full architecture plan
this was built from.

**Phase 1 (this build):** auth, onboarding, weekly plan generation, video detail generation, guided
Filming Mode (including raw clip upload per shot/voiceover line - see `media_uploads` below), Stripe
billing. **Phase 2 (not built):** the automatic AI video-*editing* pipeline (raw clips -> auto-edited
final video) - vendors (rendering API, transcription, licensed music) are intentionally undecided
pending cost research; see the plan doc §7 before starting that work. Storing the raw clips
themselves doesn't need any of those vendor decisions, which is why that part is already built.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Nova preset: Lucide + Geist) ·
Supabase (Auth + Postgres) · Anthropic API (`claude-sonnet-5`) · Stripe · TanStack Query · next-themes.

## Environment

Copy `.env.example` to `.env.local` and fill in a Supabase project, an Anthropic API key, and Stripe
keys (checkout/portal/webhook won't work without them, but the app doesn't crash - routes return a
clear 503 with a "not configured" message instead of throwing at import time).

Run the schema migrations (`supabase/migrations/*.sql`, in order) against your Supabase project
before using the app - either via the Supabase SQL editor or `supabase db push` if you have the CLI
linked. `0002_media_uploads.sql` also creates a private `clips` Storage bucket via SQL (`insert into
storage.buckets`), so running migrations is enough - no separate manual bucket-creation step in the
dashboard.

## Key files

- `src/lib/types/database.ts` - hand-written types matching the migration. **Row types must be
  `type` aliases, not `interface`s** - see the note below, this isn't a style preference.
- `src/lib/supabase/{server,client,middleware}.ts` - the three Supabase client contexts (Server
  Components/Route Handlers, Client Components, middleware). `src/lib/supabase/admin.ts` is the
  service-role client, used only by the Stripe webhook.
- `src/middleware.ts` - session refresh + route gating (no session -> `/login`; session but no
  business row -> `/onboarding`).
- `src/lib/ai/{client,brandContext,generatePlan,generateVideoDetail}.ts` - the Claude integration.
  Uses `output_config.format` + `zodOutputFormat()` + `client.messages.parse()` (current structured
  outputs API - not the deprecated prefill-forced-JSON pattern), and a `cache_control` breakpoint
  after the per-business brand context block so repeated calls for the same business are cheap.
- `src/app/api/plans/[businessId]/generate` and `src/app/api/cards/[cardId]/generate-detail` - the
  two generation endpoints. Both are synchronous (single Claude call each) - no queue needed for
  Phase 1. Video detail is generated lazily on first card open, not eagerly for all 7.
- `src/components/features/filming-mode/FilmingModeFlow.tsx` - the guided shot-by-shot flow.
  Client-side reducer for the step machine, but every "mark done" persists to
  `shot_progress`/`voiceover_progress` immediately so a mid-session refresh resumes correctly
  (hydrated from server data, not localStorage). `ClipUpload.tsx` sits inside each step - a plain
  `<input type="file" capture="environment">` (opens the phone's native camera app directly, no
  custom `getUserMedia` capture code to maintain) that uploads straight to the `clips` Storage bucket
  and records a `media_uploads` row via the browser client, gated by the RLS policies in
  `0002_media_uploads.sql` rather than a server route.
- `src/components/design-system/QrCode.tsx` - shown desktop-only (`hidden ... lg:flex`) on the
  Filming Mode page, encoding that page's own URL so scanning it continues the same guided flow (and
  clip uploads) on a phone. Resolves the absolute URL from `window.location` client-side rather than
  a server-computed host header, so it's correct on every deployment without configuration.
- **Login `next` redirect param** (`src/lib/supabase/middleware.ts`, `login/page.tsx`,
  `auth/callback/route.ts`) - middleware appends the originally-requested path when bouncing an
  unauthenticated request to `/login` (e.g. a QR scan landing on `/cards/[id]/film` while logged
  out), and login forwards it through every sign-in method so `/auth/callback` lands the user back
  where they started instead of always on `/dashboard`. Only ever accepts a same-origin relative path
  (`/...`, never `//...` or an absolute URL) - anything else is treated as unsafe and falls back to
  `/dashboard`, since `next` rides along on an otherwise-public URL and can't be trusted as-is.
- `src/lib/plans.ts` - the Base/Pro tier definitions (price, videos/week) plus the price-id <-> tier
  mapping helpers. `POST /api/plans/[businessId]/generate` looks up the business owner's active
  subscription tier (defaulting to Base if there isn't one) and passes `videosPerWeek` through to
  `generateWeeklyPlan`/`mockWeeklyPlan`, which build a dynamic-length schema/response instead of the
  old hardcoded 7. `video_cards.day_of_week` stays 0-6 either way - counts above 7 (Pro) just put more
  than one card on some days, counts below 7 (Base) leave some days empty; no schema change needed.
- **Two ways to test without spending money**, both documented in `.env.example`: `MOCK_AI=true`
  skips real Claude calls and returns templated plan/detail content built from the business's actual
  profile; `MOCK_BILLING=true` unlocks a tier switcher on `/billing`
  (`TestTierSwitcher.tsx` -> `POST /api/billing/test-tier`) that writes your subscription tier
  directly via the service-role client, bypassing Stripe entirely. Both are inert unless explicitly
  set, and neither should ever be set on a deploy with real customers - `MOCK_BILLING` in particular
  lets any signed-in user grant themselves a paid tier for free.

## Gotchas already hit

- **`interface` vs `type` for Supabase row types.** `createClient<Database>()`'s generic constraint
  checks `Database['public'] extends GenericSchema` via a conditional type. TypeScript's structural
  index-signature check for that only works against object *type aliases* - a declared `interface`
  silently fails the check and every table's inferred type collapses to `never`, with no error at
  the `Database` type declaration itself (it shows up later as confusing "Property X does not exist
  on type 'never'" errors at every call site). If you add a new table, add its row type as
  `export type Foo = {...}`, not `export interface Foo {...}`.
- **PostgREST embedded selects (`select('*, video_cards(*)')`) need real `Relationships` metadata**
  to type-check, which this hand-written `Database` type doesn't have (every table declares
  `Relationships: []`). Rather than hand-crafting that metadata, every embed in this codebase is
  written as two plain single-table queries instead. Keep doing that unless you regenerate this file
  with `supabase gen types typescript` against a real linked project.
- **`eslint-config-next`'s flat-config export isn't array-shaped in this Next 15.5.x version** -
  `eslint.config.mjs` uses `@eslint/eslintrc`'s `FlatCompat` bridge (`compat.extends(...)`), not a
  direct spread of the package export. Don't "simplify" this back to `import nextVitals from
  "eslint-config-next/core-web-vitals"` - it was the original scaffold default and doesn't work.

## Design language

Neutral palette (`--bg-canvas`, `--bg-surface`/`bg-surface`, `--border-subtle`, `--text-secondary`)
plus one accent (`--primary`, an indigo, not blue - blue reads as generic-SaaS) defined in
`src/app/globals.css`. Radius capped at the shadcn default `--radius-lg` (10px) - never reach for
Tailwind's `rounded-xl`/`2xl`/`3xl` in new components, that's the single most direct violation of the
"don't look AI-generated" brief. Borders over shadows for separation; shadows reserved for genuinely
elevated surfaces (dropdowns, modals). Dark-first via `next-themes` (`defaultTheme="dark"`), with a
user-facing toggle (`src/components/design-system/ThemeToggle.tsx`, in the dashboard nav) switching
`resolvedTheme` between `dark`/`light` - both palettes are fully defined in `globals.css`, so this is
just wiring, not new tokens. The onboarding page and the landing page's hero section additionally use
a `.bg-blueprint-grid` utility (also in `globals.css`) - a faint two-scale grid in the primary accent
color, radially masked - as a subtle nod to the product name; keep it off other pages (dashboard,
settings, etc.), it's decorative and meant for pre-auth/entry screens only.

**Exception - the login page.** `src/app/(auth)/login/page.tsx` intentionally breaks from the rest of
this section per explicit client request: a "Liquid Glass" floating card (`backdrop-blur`,
translucent `bg-white/10`/`dark:bg-white/[0.06]` fills, `rounded-3xl`, inset highlight via
`shadow-[...inset...]`) over a full-bleed `.bg-blueprint-grid` background with two blurred `bg-primary`
glow orbs for depth. This is the one place in the app that uses glassmorphism and a radius above
`--radius-lg` - don't "fix" it back to the neutral/thin-border/capped-radius system used everywhere
else; that's a deliberate, asked-for departure for this screen specifically, not drift.
