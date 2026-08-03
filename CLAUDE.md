# Blueprint Studio

AI social media manager for small businesses. Weekly, a business gets a batch of personalized
short-form video ideas (5/week on the Base plan, 10/week on Pro - see `src/lib/plans.ts`); opening
one generates a full shot list, script, and captions; a guided Filming Mode walks the owner through
recording it. See `/root/.claude/plans/functional-plotting-seal.md` for the full architecture plan
this was built from.

**Phase 1 (this build):** auth, onboarding, weekly plan generation, video detail generation, guided
Filming Mode (including raw clip upload per shot/voiceover line - see `media_uploads` below), Stripe
billing. **Phase 2, in progress:** the auto-editing pipeline (raw clips -> rendered final video with
burned-in captions) - built provider-agnostic behind a swappable `RenderProvider` interface (see
`src/lib/video/`). `CreatomateRenderProvider` is the real implementation, running on Creatomate's free
50-credit trial (no card required, ~3.5 min of 720p video) until the client commits to a paid tier
(~$54/mo+, Essential) - `getRenderProvider()` picks it automatically once `CREATOMATE_API_KEY` is set,
falling back to the zero-cost `MockRenderProvider` otherwise, so local/CI development never needs the
key. **Music is explicitly out of scope for now** (licensing terms for a SaaS platform serving many
end customers are genuinely unclear even on libraries marketed as "free for commercial use" - see the
chat log around 2026-08 for the research) - there's no `music_tracks` table and no music field on
`RenderRecipe`. Captions are *not* a separate transcription step (no Deepgram) - the exact scripted
`voiceover_lines.text` is used directly as caption text, since we already know verbatim what should be
said; only word-level *timing* would need real ASR, which is deferred along with the transcription
vendor decision.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Nova preset: Lucide icons; Work
Sans body / Archivo headings / IBM Plex Mono eyebrows - see "Design language" below) · Supabase (Auth +
Postgres) · Anthropic API (`claude-sonnet-5`) · Stripe · TanStack Query · next-themes.

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
- `src/app/api/cards/[cardId]/regenerate` (`src/lib/ai/regenerateCardIdea.ts`,
  `RegenerateCardButton.tsx`) - swaps out a single day's video idea in place, keeping the same
  `video_cards.id`/URL rather than the whole-week regenerate's delete-and-reinsert (which mints new
  card ids). Fetches the week's other card titles first and tells Claude not to duplicate them. The
  AI call happens *before* any deletion, so a failed regenerate (e.g. `AnthropicNotConfiguredError`)
  never touches existing content. On success it deletes `video_details`/`shots`/`voiceover_lines`/
  `filming_sessions` (cascades progress rows)/`render_jobs` for that card - they're built from the
  old idea and no longer apply - and removes any uploaded clip blobs from the `clips` Storage bucket
  first, since a cascaded row delete doesn't delete the underlying object. Resets `video_cards.status`
  to `pending_detail`. The button only shows the destructive-action confirmation dialog when there's
  actually a `video_details` row (i.e. a shot list/script/possibly filmed clips) to lose; before that
  it regenerates immediately with no dialog since nothing is at stake yet.
- `src/components/features/filming-mode/FilmingModeFlow.tsx` - the guided shot-by-shot flow.
  Client-side reducer for the step machine, but every "mark done" persists to
  `shot_progress`/`voiceover_progress` immediately so a mid-session refresh resumes correctly
  (hydrated from server data, not localStorage). `ClipUpload.tsx` sits inside each step and splits by
  target kind: shots use a plain `<input type="file" accept="video/*" capture="environment">` (opens
  the phone's native camera app directly - reliable and needs no `getUserMedia` code to maintain);
  voiceover lines record in-browser instead via `getUserMedia`/`MediaRecorder`, because the `capture`
  attribute for *audio* is unreliable across mobile browsers (iOS Safari in particular has no real
  "record audio" capture handler and silently falls back to opening the camera regardless of `accept`
  - confirmed by hitting exactly that bug on-device). Feature-detected in a `useEffect` (avoids an SSR/
  client hydration mismatch from checking `navigator` at render time) with a plain `accept="audio/*"`
  file-picker fallback for browsers without `MediaRecorder` support. Either path uploads straight to
  the `clips` Storage bucket and records a `media_uploads` row via the browser client, gated by the
  RLS policies in `0002_media_uploads.sql` rather than a server route.
- `src/components/design-system/QrCode.tsx` - shown desktop-only (`hidden ... lg:flex`) on the
  Filming Mode page, encoding an auto-login URL (`/auth/qr?token=...`) so scanning it signs you in on
  your phone and continues the same guided flow (and clip uploads) without re-entering credentials.
  Resolves the absolute URL from `window.location` client-side rather than a server-computed host
  header, so it's correct on every deployment without configuration.
- **QR auto-login** (`src/lib/qrLogin.ts`, `src/app/auth/qr/route.ts`,
  `supabase/migrations/0003_qr_login_tokens.sql`) - a real auth-bypass mechanism, built carefully on
  purpose: the token is 256 bits of `crypto.randomBytes` (not guessable), single-use (consumed via an
  atomic conditional `UPDATE ... WHERE used_at IS NULL AND expires_at > now() RETURNING ...`, so a
  race between two requests for the same token can only let one through), expires in 2 minutes, and
  `qr_login_tokens` has RLS enabled with **zero policies** - default-deny for the anon/authenticated
  roles, reachable only through the service-role client, same as `stripe_events`. Redemption exchanges
  the token for a real session via `admin.generateLink({type:'magiclink'})` +
  `supabase.auth.verifyOtp({type:'magiclink', token_hash})` server-side (no email is actually sent).
  Phone-only accounts (no email on file) fall back to a normal manual sign-in, same as before this
  existed. `/auth/qr` has to be in `middleware.ts`'s `PUBLIC_PATHS` - it's hit while signed out by
  design, and its own token validity is what gates it, not session state. If you ever touch this flow,
  keep the short expiry and single-use consume - anyone who sees the QR code (a screenshot, a photo,
  a shared screen) can use it until it expires, which is the tradeoff explicitly accepted here in
  exchange for a much smoother scan-to-film handoff.
- **Login `next` redirect param** (`src/lib/supabase/middleware.ts`, `login/page.tsx`,
  `auth/callback/route.ts`) - middleware appends the originally-requested path when bouncing an
  unauthenticated request to `/login` (e.g. a QR scan landing on `/cards/[id]/film` while logged
  out), and login forwards it through every sign-in method so `/auth/callback` lands the user back
  where they started instead of always on `/dashboard`. Only ever accepts a same-origin relative path
  (`/...`, never `//...` or an absolute URL) - anything else is treated as unsafe and falls back to
  `/dashboard`, since `next` rides along on an otherwise-public URL and can't be trusted as-is.
- **Auto-editing pipeline** (`src/lib/video/{render,recipeBuilder,mockProvider,creatomateProvider}.ts`,
  `POST /api/cards/[cardId]/render`, `render_jobs` table) - `recipeBuilder.ts` assembles a
  provider-agnostic `RenderRecipe` (shots in order for the visual track, voiceover lines' exact
  script text for captions, no music field) from a card's shots/voiceover_lines/media_uploads.
  `RenderProvider` (`render.ts`) is the swappable interface `submitRenderJob`/`getStatus`;
  `getRenderProvider()` returns `CreatomateRenderProvider` when `CREATOMATE_API_KEY` is set, else
  `MockRenderProvider`, which "renders" after a simulated 4s delay and returns a signed URL to the
  first uploaded clip as an honest preview - the UI labels this clearly as a mock (`isMock` in
  `RenderVideoPanel.tsx`, derived from the specific job's own `provider` column so a page never lies
  about which one actually produced a given result) so it's never mistaken for a real multi-clip,
  captioned edit. `CreatomateRenderProvider` (`creatomateProvider.ts`) builds a RenderScript
  composition directly (no pre-built Creatomate template): shot clips play back to back muted on
  track 1 (the voiceover carries the audio instead, same as a typical UGC edit), and each voiceover
  line becomes its own `composition` element on track 2 pairing that line's audio with a caption
  `text` element - grouping them lets Creatomate derive the caption's on-screen duration from the
  audio's real length automatically, without us computing any timing ourselves (consistent with the
  no-ASR decision above). Source clips are read via signed URLs from the private `clips` bucket
  (1hr TTL, enough for Creatomate to fetch them even if queued); output aspect ratio is locked to
  9:16 (1080x1920), the only ratio `RenderRecipe` supports. The render route validates every
  shot/voiceover line has an uploaded clip first (`missingClipCounts`) before starting - no music to
  paper over a gap. `RenderVideoPanel.tsx` polls `GET /api/cards/[cardId]/render` every 2s while a
  job is queued/rendering, showing `RenderingAnimation.tsx` (a purely cosmetic 4-step sequence - it
  doesn't track real backend progress, since queued/rendering/complete/failed is all the status the
  API exposes) full-screen via `createPortal(..., document.body)` instead of inline in the panel -
  the edit is the product's main event, not a background task, so it takes over the whole viewport
  (with body scroll locked for the duration) rather than playing out in a small card. That full-screen
  takeover enforces a **hard 5-second minimum display time** for the animation, gated off the render
  job's real `created_at` (not component-mount time, so a mid-render page refresh still gates
  correctly): `job`/`setJob` track the true polled state, `displayJob`/`setDisplayJob` track what's
  rendered, and `revealWhenReady()` delays flipping `displayJob` to a `complete`/`failed` result via
  `setTimeout` until 5s have elapsed since `created_at`, even though the mock provider itself finishes
  in ~4s (a real Creatomate render can easily take longer, in which case this minimum is a no-op - the
  gate only ever adds wait time, never cuts a real render short) - a render that visibly resolves in
  under a second reads as fake, not fast. The sweeping progress bar inside `RenderingAnimation.tsx`
  uses a `.render-sweep` keyframe in `globals.css`, following the same `prefers-reduced-motion` guard
  pattern as `.glow-orb`/`.bg-blueprint-grid`. **Cross-page render notifications**
  (`RenderNotifications.tsx`, `GET /api/render-jobs/active`) - `RenderVideoPanel`'s own polling stops
  the moment its component unmounts, so a render started on one card and then navigated away from
  (increasingly likely once a real vendor's renders take longer than the mock's ~4s) would otherwise
  finish silently. `RenderNotifications` is mounted once in `(dashboard)/layout.tsx` - no visible UI
  of its own - and discovers any `queued`/`rendering` jobs for the signed-in business via the new
  active-jobs route (re-polled every 8s, not just once on mount, so a render started *after* the
  layout mounted still gets picked up), then polls each one's status every 5s independently. On
  completion/failure it fires a `sonner` toast with a "View" action linking to
  `/cards/[cardId]#auto-edit`, plus a native browser `Notification` if permission was already
  granted (works even if the tab is backgrounded, though not if it's fully closed - there's no
  service worker/push infrastructure here, so that's the ceiling). Permission is requested
  best-effort from `RenderVideoPanel.startRender()` itself (tied to the action that will actually use
  it, not asked cold on page load).
- `src/components/features/dashboard/TipOfTheDay.tsx` - a short tip shown at the top of the dashboard,
  picked deterministically from a fixed list by day-of-year (`Date.UTC`-based, no client state) so
  it's stable across refreshes without needing to persist anything. Tips are specifically about
  getting more out of Blueprint Studio's own features (regenerating a single card, Filming Mode's
  skip/resume, QR auto-login, in-browser voiceover recording, the auto-edit trigger and its
  script-sourced captions, cross-page render notifications, the editing-suggestions field) rather
  than generic filming/social-media advice - each one should be checkable against a real feature.
- `src/components/design-system/VideoCardTile.tsx` - the dashboard grid's per-card tile, redesigned
  ("icon-led, progress-driven") after presenting three mockup directions to the client via
  `AskUserQuestion` previews. A `Record<ContentGoal, LucideIcon>` maps each of the 5 content goals to
  a distinct icon (Lightbulb/TrendingUp/PartyPopper/ShieldCheck/MessageCircle) shown in a chip instead
  of a text badge - `VideoCard` has no thumbnail/image field, so goal-differentiation is the only
  per-card visual variety available without a schema change. A static (non-animated) 4-segment
  progress bar replaces the old status `StatusBadge`, stepped by `video_cards.status`
  (`pending_detail`/`detail_ready`/`filming` = 1-3 segments in `bg-primary`; `complete` = all 4 in
  `bg-emerald-500`, reusing `WeekProgress.tsx`'s existing "green when fully done" convention so the
  grid and the week-summary bar agree on what "done" looks like). Deliberately *not* reusing
  `StepIndicator.tsx`'s pulsing active-segment animation - that reads right for one in-progress flow
  (Filming Mode) but would be distracting reproduced across a whole grid of simultaneously-pulsing
  cards. Both the goal icon and the progress bar carry an `aria-label` so the goal and status are
  still announced to screen readers despite no visible text label for either anymore. Cards due
  today (`new Date().getDay() === card.day_of_week`, server-local time - this app has no stored
  business timezone, acceptable for a soft cosmetic highlight) get a `ring-1 ring-primary/25` and a
  bolded/colored day label. The hover arrow (`ArrowRight` with `group-hover:translate-x-0.5`) matches
  the micro-interaction already used by the landing page's CTA and the card detail page's "Ready to
  film?" banner - this tile was the one interactive card in the app without it.
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
plus one accent (`--primary`, a warm terracotta/rust - not indigo/purple, which read as the most
overused "trying not to be blue" SaaS accent; terracotta also nods to the red/amber pencil used to
annotate blue technical drawings) defined in `src/app/globals.css`. **Radius is tiered on purpose,
not uniform** - functional UI (buttons, inputs, badges) stays at the shadcn default `--radius-lg`
(10px); **every bordered content section uses one value, `rounded-xl`** (pricing/onboarding cards,
the card detail page's Hook/reference/"Ready to post" sections, Filming Mode's step card, `RenderVideoPanel`)
so there's a single, consistent "card container" affordance instead of three or four radii competing
for the same job; `rounded-2xl` is reserved for exactly one genuinely-elevated showcase panel per
screen (the landing hero/features browser-chrome mockups, the card page's "Ready to film?" CTA banner
specifically as a nav/CTA element rather than a content-display section, the login glass card). Section eyebrows and small
technical labels (`STEP 2 OF 5`, day-of-week tags, the landing page's section kickers) use
`font-mono` (IBM Plex Mono, loaded as `--font-ibm-plex-mono` - replaced Geist Mono for a more
deliberately professional/enterprise feel) to differentiate from body text and reinforce the
"blueprint" identity. **Type system**: body copy is Work Sans (`--font-sans`); all
headings (`h1`-`h6`, site-wide via a `@layer base` rule in `globals.css` rather than a class added to
every heading individually) are Archivo (`--font-heading`/`--font-archivo`) for more presence than
the body face without going all the way to a display weight everywhere. The landing page's hero `h1`
specifically uses Archivo Black (`--font-display`/`--font-archivo-black`, applied via the `font-display`
utility class) for one heavier, more declarative moment - Archivo Black is a single fixed weight, so
it's reserved for that one large headline rather than blanket-applied to every heading (at smaller
sizes, or combined with a `font-semibold`/`font-bold` utility, a single-weight face either does
nothing extra or risks the browser faux-bolding an already-black face). The `h2` "section eyebrow"
labels (`Script`, `Shot list`, `Voiceover script`, etc. on the card detail page) explicitly set
`font-mono` on themselves - since that's a Tailwind *utility* class, it wins over the *base-layer*
heading rule's `font-family` regardless of selector specificity (Tailwind's base layer is emitted
before its utilities layer in the cascade), so those stay monospace as intended; verified this
holds via computed-style checks, not just assumed. Borders over shadows for
separation; shadows reserved for genuinely elevated surfaces (dropdowns, modals, and the `rounded-2xl`
showcase panels above) - dropped from ordinary bordered sections (card detail page, `RenderVideoPanel`,
Filming Mode's step card) since a shadow next to a border on a dark canvas is redundant and reads as
noise, not depth. **Icon chips are used sparingly, not as a default decoration** - after a client
review pass called out the app as "looking AI-made" (traced to Linear's own stated principle of no
decorative icon backgrounds/"no spotlight card," researched directly rather than assumed), every
`h-9 w-9 rounded-lg bg-primary/10` icon-in-a-tinted-circle instance in the app was re-evaluated
individually rather than blanket-removed: purely decorative ones were deleted outright (landing STEPS,
`WeekProgress`), meaning-carrying ones were de-chipped down to a plain icon next to a *visible* text
label instead of an `aria-label`-only chip (`VideoCardTile`'s goal icon, `TipOfTheDay`, `EmptyState`,
the login page's magic-link confirmation, the card page's "Ready to film?" banner, Filming Mode's
per-step Camera/Mic icon), and `RenderingAnimation`'s 4 step icons became a real stepper (solid fill
once done/active, bordered-transparent otherwise) instead of a static tinted circle. Legitimate
terminal/transient result icons (Filming Mode's skipped/all-done/`justCompleted` states,
`ShotListItem`'s numbered index circle) were left alone - the goal was removing decoration, not every
icon. The card detail page (`cards/[cardId]/page.tsx`) collapsed from 9 independently-boxed sections
at 3 different radii into 4 visual zones for the same reason: a CTA banner, a Hook section marked by a
hairline `border-l-2 border-l-primary` accent rule instead of a second filled spotlight card, one
consolidated `rounded-xl` reference shell (Script/Voiceover script side-by-side, then Shot list,
Voiceover lines, and On-screen text/Editing suggestions behind `border-t` dividers - same conditional
rendering as before, one container instead of six), and "Ready to post" kept separate since it's
categorically different output, not filming reference. The landing page's "How it works" and
"Features" sections used to be the same icon-chip-grid component repeated twice back to back with only
the copy swapped; STEPS is now a single hairline-divided row (number + heading, no icon - the numeral
already carries the visual weight) and FEATURES is a plain editorial list paired with a second
product-screenshot mockup (reusing the hero's browser-chrome treatment to show a Hook + shot list
moment) rather than a second icon grid, per the "dense with product screenshots, not icon grids"
principle. Interactive cards (video tiles, feature/pricing cards) use the `.hover-lift`
utility (`globals.css`) - a small translateY + accent-tinted shadow on hover, not a decorative fade,
skipped under `prefers-reduced-motion`. Dark-first via `next-themes` (`defaultTheme="dark"`), with a
user-facing toggle (`src/components/design-system/ThemeToggle.tsx`, in the dashboard nav) switching
`resolvedTheme` between `dark`/`light` - both palettes are fully defined in `globals.css`, so this is
just wiring, not new tokens. `src/components/providers.tsx`'s `LIGHT_ONLY_PATHS` (`/`, `/login`,
`/onboarding`) forces `light` via `ThemeProvider`'s `forcedTheme` on the landing page, login, and
onboarding - there's no toggle on any of them, so dark mode would just be an unstyled/unintended
combination rather than a real supported state. The onboarding page, both `.bg-blueprint-grid`
sections on the landing page (hero and closing CTA), the login page, and the dashboard's empty state
use a `.bg-blueprint-grid` utility (also in `globals.css`) - a faint two-scale grid in the primary
accent color, radially masked - as a subtle nod to the product name. On landing, onboarding, and
login, the grid's default constant diagonal drift is swapped for `MouseShine.tsx`
(`src/components/design-system/`) - a small light confined to the grid's own 1px lines (not the open
squares between them) that tracks the visitor's cursor instead of animating on its own, via the
`.bg-blueprint-grid-interactive` modifier class (`animation: none`) plus a `<MouseShine />` child.
Went through two failed attempts before landing on the current technique, both documented here so a
third attempt doesn't repeat them: (1) a plain radial-gradient in `background` with no confinement to
the lines at all, and (2) confining that gradient to the lines via `mask-image` built from four
comma-separated line-pattern gradients (mirroring `.bg-blueprint-grid`'s own `background-image`
structure) - reportedly invisible on-device despite verifying fine in this repo's testing setup, most
likely inconsistent default `mask-composite` behavior across engines when multiple `mask-image` layers
need to union together. The current version swaps which property holds which: the four-layer line
pattern is the `background-image` (multiple `background-image` layers always just stack in paint
order, no composite ambiguity to go wrong) and it's clipped to a small area around the cursor with a
*single* `mask-image: radial-gradient(...)` - the exact same single-layer-mask technique
`.bg-blueprint-grid` already uses successfully for its own edge fade a few lines above. Only verified
in Chromium (the only engine available in this sandbox); if it's ever reported invisible again on a
specific device, check `mask-composite`/engine-specific quirks before reaching for a different
approach entirely. Also deliberately has no `mix-blend-mode`: these screens are locked to the light
theme (near-white canvas), where `screen` blending is essentially invisible regardless of blend color
(an earlier version used it and couldn't be seen even zoomed in). It mutates a ref'd DOM node's
`--shine-x`/`--shine-y` CSS custom properties directly from a `mousemove`
listener on its parent element (not React state, so cursor movement never triggers a re-render),
rAF-throttled, and listens on the *parent* rather than `window` so the landing page's two independent
sections each track correctly. Skips attaching the listener entirely under `prefers-reduced-motion`
(falls back to a fixed default position) and degrades the same way on touch devices, which never fire
`mousemove`. Only the dashboard empty state keeps the original drift untouched - this is scoped to
the marketing/auth screens, per explicit request, not a wholesale replacement of
`.bg-blueprint-grid`'s default behavior. `MouseShine` takes a `stacking` prop (`'below-content'`
default, or `'above-siblings'`)
because the two screens need opposite z-index handling: on landing/onboarding the grid pattern is
the section's own CSS background, so the shine needs a negative z-index to sit behind the plain
static in-flow copy above it; on login the grid is a separate absolutely-positioned sibling `<div>`
(part of the glassmorphism layering below), where a negative z-index would instead hide the shine
*behind* that div's own opaque background - `stacking="above-siblings"` leaves z-index at auto there
so plain DOM order (placed right after the grid div) puts it on top correctly.
`InteractiveLogo.tsx` (same directory) applies the same idea at icon scale: the "Blueprint Studio"
logo mark on the landing header and the login page gets a small glossy highlight (`.logo-shine`,
blended with `mix-blend-mode: overlay` so it reads as light on a glossy surface rather than a flat
white smudge) clipped to the mark's own rounded-square shape via a wrapping `overflow-hidden` span.
It tracks `window` mousemove rather than a parent element - unlike `MouseShine`, there's only ever
one logo per page, so there's no risk of multiple instances needing independent tracking. Plain
`Logo.tsx` (no client-side behavior) is still used as-is anywhere the shine wasn't requested, e.g.
the dashboard nav.

**Exception - the login page.** `src/app/(auth)/login/page.tsx` intentionally breaks from the rest of
this section per explicit client request: a "Liquid Glass" floating card (`backdrop-blur`,
translucent `bg-white/10`/`dark:bg-white/[0.06]` fills, `rounded-3xl`, inset highlight via
`shadow-[...inset...]`) over a full-bleed `.bg-blueprint-grid` background with two blurred `bg-primary`
glow orbs for depth. This is the one place in the app that uses glassmorphism and a radius above
`--radius-lg` - don't "fix" it back to the neutral/thin-border/capped-radius system used everywhere
else; that's a deliberate, asked-for departure for this screen specifically, not drift.
