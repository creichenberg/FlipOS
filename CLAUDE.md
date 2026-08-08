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
Sans body / Archivo headings, no monospace face - see "Design language" below) · Supabase (Auth +
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
- `src/app/privacy/page.tsx` - a plain-language Privacy Policy describing what the app actually
  collects and does with it (account info, business profile, uploaded clips, billing) rather than
  generic legal boilerplate - written to match the real data flows (Supabase, Anthropic, Stripe, and
  the render provider) so it stays accurate as those change, not a substitute for real legal review.
  Linked from the landing page footer. Public and light-only, same as the rest of the pre-auth pages
  (`PUBLIC_PATHS` in `src/lib/supabase/middleware.ts`, `LIGHT_ONLY_PATHS` in
  `src/components/providers.tsx`).
- `src/app/terms/page.tsx` - Terms of Service, identical structural/visual pattern to `/privacy`
  (same header, `max-w-3xl` container, "Legal" eyebrow, dynamic "Last updated" line, `h2`/`p`/`ul`
  section list). Content is grounded in real product mechanics rather than generic SaaS boilerplate:
  the actual Base/Pro pricing and video counts (pulled live from `PLAN_TIERS` in `src/lib/plans.ts`,
  not hand-typed, so it can't drift out of sync with a future pricing change), cancellation via the
  Stripe billing portal taking effect at period end with no proration, a content-ownership/limited-
  license clause covering uploaded clips and the render provider, and an acceptable-use clause
  prohibiting illegal/infringing/deceptive content - this last one is the whole "content moderation"
  answer for now, matching the original architecture plan's explicit stance ("ToS + a reactive review
  queue is the pragmatic approach, revisit with a moderation API if abuse becomes real") rather than
  new admin/flagging infrastructure nobody has needed yet. Linked from the landing page footer
  alongside Privacy Policy, and registered in the same two path lists `/privacy` is (`PUBLIC_PATHS` in
  `src/lib/supabase/middleware.ts`, `LIGHT_ONLY_PATHS` in `src/components/providers.tsx`).
- `src/lib/ai/{client,brandContext,generatePlan,generateVideoDetail,regenerateCardIdea}.ts` - the
  Claude integration. Uses `output_config.format` + `zodOutputFormat()` + `client.messages.parse()`
  (current structured outputs API - not the deprecated prefill-forced-JSON pattern), and a
  `cache_control` breakpoint after the per-business brand context block so repeated calls for the
  same business are cheap. All three generation calls pass `thinking: { type: 'disabled' }` - the
  model (`claude-sonnet-5`) runs adaptive thinking by default even with no `thinking` param set at
  all, silently spending extra latency and billed output tokens reasoning before ever producing the
  structured JSON. None of these three calls need that: the ideas/script are already grounded by
  `brandContext`/the system instructions and shaped by the Zod schema, not by multi-step reasoning,
  so disabling it is a straight win on both speed and cost - not a quality-for-speed tradeoff like
  swapping to a cheaper model would be.
- `src/app/api/plans/[businessId]/generate` and `src/app/api/cards/[cardId]/generate-detail` - the
  two generation endpoints. Both are synchronous (single Claude call each) - no queue needed for
  Phase 1. Video detail is generated lazily on first card open, not eagerly for all 7. Both loading
  states (`GeneratePlanButton.tsx`, `DetailGenerator.tsx`) pair their skeleton placeholder with a
  small pulsing `Sparkles` icon next to the "Building..." text - `Sparkles` is the same icon already
  used elsewhere for AI-generated-content moments (the card detail page's Hook eyebrow), so it reads
  as a consistent "AI is working" marker rather than a one-off addition; guarded with
  `motion-reduce:animate-none` directly on the element, the same per-element pattern
  `RenderingAnimation.tsx`'s active-step icon already uses, rather than a global CSS override.
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
- `src/components/features/filming-mode/FilmingModeFlow.tsx` - the guided shot-by-shot flow. A plain
  `useState` index into the ordered shot/voiceover-line list - every step must be completed in order,
  there's no skip/resume (removed per explicit client feedback that skipping undermined the guided
  flow; a `useReducer` + done/skipped `Set`s tracked that before, which is why this is a plain index
  now instead). Every "mark done" persists to `shot_progress`/`voiceover_progress` immediately so a
  mid-session refresh resumes correctly (hydrated from server data via `initialDone`, not localStorage
  or client-only state). `ClipUpload.tsx` sits inside each step and splits by
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
- **Auth** (`src/app/(auth)/login/page.tsx`, `src/app/auth/reset-password/page.tsx`) - email+password
  (Sign in / Sign up tabs) plus Google OAuth; magic link and phone/SMS OTP were removed entirely per
  explicit client feedback ("I don't like the magic link thing too much"). Sign-up calls
  `supabase.auth.signUp()` and checks whether `data.session` came back immediately - it won't if the
  Supabase project requires email confirmation, in which case a "check your email" state shows instead
  of a false redirect. Forgot-password (`resetPasswordForEmail`) routes its reset link through
  `/auth/callback?next=/auth/reset-password` rather than straight to the reset page - `/auth/callback`
  already does the `exchangeCodeForSession` work needed to turn the emailed recovery code into a real
  session (same code path Google OAuth uses), so `/auth/reset-password` itself stays a plain form with
  no exchange logic of its own; by the time it renders, middleware sees a real session and lets it
  through without needing to be in `PUBLIC_PATHS`. Onboarding collects a **`owner_name`** field
  (`businesses.owner_name`, `supabase/migrations/0005_owner_name.sql`) - the person's own name,
  separate from the business name - used for the dashboard's "Welcome back, `<first name>`" greeting
  (`business.owner_name.split(' ')[0]`) instead of addressing the owner by their own company's name;
  editable later from Settings (`EditBusinessForm.tsx`) alongside the rest of the business profile.
  Its Industry field is plain free text - a `<datalist>`-backed autocomplete was tried and then
  removed per explicit client feedback that it should only be typed, not selected from suggestions.
- `StepIndicator.tsx` takes an `activeColor` prop (`'primary'` default, or `'emerald'`) controlling
  the currently-active segment's pulsing overlay color - the done/not-done segments are always
  green/grey regardless, only the in-progress segment's accent changes. Filming Mode (the only other
  caller) keeps the default blue pulse; onboarding passes `activeColor="emerald"` per a client
  request that its progress bar read as strictly grey-to-green with no blue accent introduced.
- **Onboarding UX pass** (`OnboardingWizard.tsx`, `GeneratePlanButton.tsx`, `dashboard/page.tsx`) -
  client feedback that onboarding "feels unsatisfying and annoying" turned out to be two separate,
  concrete problems once diagnosed against the actual code, not one vague complaint: friction inside
  the 3-step form itself, and an anticlimactic gap between finishing setup and seeing real content.
  **Friction fixes**: steps 0 and 2 previously gave zero feedback about why Continue/Finish was
  disabled (step 1's character-count hint was the only inline validation in the whole flow) - both now
  show a small hint under the button naming exactly which field(s) still need input
  (`missingStep0Fields`/`missingStep2Fields` + `joinMissing`). Every required field gets a small
  `*` marker (muted, not alarming red - this app has no error-red convention and shouldn't invent one
  just for this) so what's mandatory is predictable before hitting a wall, not just after. Brand
  personality (12 chips, the most visually prominent element on step 2) used to look required but
  wasn't - the much smaller goals checklist below it was the only thing actually gating submission;
  it's now genuinely required (≥1 trait or a value in "Other"), matching the app's existing philosophy
  that specific answers produce meaningfully better personalized output (the same reasoning already
  behind step 1's 20-character minimums). Step transitions now use the same `animate-in fade-in
  slide-in-from-right-2 duration-300` pattern (keyed on `step`) already proven in
  `FilmingModeFlow.tsx`, closing the gap between the progress bar's smooth animated fill and the
  content directly beneath it, which previously hard-cut with no transition at all. Form state
  (all fields + current step) now persists to `localStorage` under a fixed key on every change and
  restores on mount - a real, reproducible bug found during this pass: any refresh, back-navigation,
  or the middleware's own "no business row -> force `/onboarding`" redirect (which fires on *every*
  navigation until a business row exists) silently wiped a partially-filled form back to a blank step
  0. Cleared on successful submit. **The payoff-gap fix**: "Finish setup" used to redirect straight to
  a completely empty dashboard, with generating the first week's content left as a separate, unstated
  manual "Generate this week's plan" click. It now redirects to `/dashboard?onboarded=1`, and the
  dashboard auto-triggers that same generation call itself when it sees the flag and there's no plan
  yet - `GeneratePlanButton.tsx` gained an `autoStart` prop that fires its existing `generate()` call
  once on mount (guarded via a ref against double-fire) and strips the query param immediately via
  `router.replace` so a later refresh doesn't regenerate. Reuses the exact same loading UI
  (`Sparkles` + `SkeletonCardGrid`) already built for the manual-click path - no new loading state to
  design. One layout wrinkle caught during visual verification: that loading UI is a full 7-card
  responsive grid, sized for the page, not for `EmptyState`'s small centered `action` slot it normally
  sits inside - stuffing it in there made it overflow the dashed-border box entirely. The fix was
  structural, not cosmetic: the auto-start case in `dashboard/page.tsx` skips `EmptyState` altogether
  and renders `GeneratePlanButton` directly in the page body (matching how the real populated card
  grid renders once a plan exists), while the plain manual-click "no plan yet" state keeps its
  `EmptyState` wrapper unchanged.
- **QR auto-login** (`src/lib/qrLogin.ts`, `src/app/auth/qr/route.ts`,
  `supabase/migrations/0003_qr_login_tokens.sql`) - a real auth-bypass mechanism, built carefully on
  purpose: the token is 256 bits of `crypto.randomBytes` (not guessable), single-use (consumed via an
  atomic conditional `UPDATE ... WHERE used_at IS NULL AND expires_at > now() RETURNING ...`, so a
  race between two requests for the same token can only let one through), expires in 2 minutes, and
  `qr_login_tokens` has RLS enabled with **zero policies** - default-deny for the anon/authenticated
  roles, reachable only through the service-role client, same as `stripe_events`. Redemption exchanges
  the token for a real session via `admin.generateLink({type:'magiclink'})` +
  `supabase.auth.verifyOtp({type:'magiclink', token_hash})` server-side (no email is actually sent) -
  an *internal* admin-generated mechanism unrelated to the user-facing magic-link login option removed
  above; it never went through the login page's UI, so removing that option didn't touch this. A
  phone-only account (no email on file) would fall back to a normal manual sign-in, though that's now
  a purely legacy/defensive branch - phone/SMS sign-up no longer exists, so no new phone-only accounts
  can be created. `/auth/qr` has to be in `middleware.ts`'s `PUBLIC_PATHS` - it's hit while signed out
  by design, and its own token validity is what gates it, not session state. If you ever touch this
  flow, keep the short expiry and single-use consume - anyone who sees the QR code (a screenshot, a
  photo, a shared screen) can use it until it expires, which is the tradeoff explicitly accepted here
  in exchange for a much smoother scan-to-film handoff.
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
  track 1 (the voiceover carries the audio instead, same as a typical UGC edit). Each clip is
  **trimmed to its own shot's planned `duration_seconds`** (`trim_start: 0`/`trim_duration`, a
  Zod-enforced `min(1)` so it's never zero/negative) rather than playing however long the raw
  recording happens to run, so pacing matches the shot list instead of rambling; every clip gets a
  continuous zoom (`type: "scale"` - a "Ken Burns" effect, `zoomRange()`) over the clip's own
  duration so nothing sits perfectly static; every clip but the first also gets a quick 0.25s
  crossfade (`type: "fade", transition: true`, the Creatomate mechanism for bridging two consecutive
  elements on the same track) instead of a hard cut, so shot changes read as an edit rather than a
  slideshow. All three are purely mechanical RenderScript properties verified against Creatomate's
  docs - no new vendor, no added cost. **Per-clip variety pass** (`zoomRange()`): the client felt the
  auto-edit needed to look more like a real edit than "something thrown together in CapCut in 10
  seconds" - clarified via `AskUserQuestion` into a scoped, no-new-vendor polish pass rather than
  committing to the still-deferred ASR/music vendor decisions. The zoom now alternates direction by
  clip index (even clips push in from 100%, odd clips pull back from 106%) instead of the exact same
  zoom-in on every single clip, since identical motion repeated across 7-10 consecutive shots read as
  mechanical rather than edited; the first clip (the hook) pushes further (112% vs the usual 106%)
  since that's the scroll-stopping moment.
  **Word-by-word captions**: each voiceover line becomes its own `composition` element on track 2
  pairing that line's audio with one `text` element *per word* (split on whitespace) instead of one
  text element for the whole line. There's still no real word-level timing (ASR) - per the standing
  no-ASR decision, that's a real vendor/cost call the client hasn't made, not something to sneak in as
  a side effect of a styling change. Instead every word gets an equal `"1 fr"` fractional duration,
  Creatomate's own mechanism (confirmed against their docs, not guessed) for splitting a track's time
  evenly among siblings without knowing the total ahead of time - the words all share one explicit
  local track (`CAPTION_WORD_TRACK`) so they queue up in sequence, while the audio is left on its own
  auto-assigned track so it still drives the composition's real duration, same as before. This
  approximates natural word-by-word pacing (assumes even timing per word, not actually synced to
  pauses/emphasis in the real take) rather than truly transcribing it - a deliberate, explicit tradeoff
  picked over onboarding a real ASR vendor, not a stand-in that pretends to be the real thing. Falls
  back to one whole-line text element (the original behavior) if a line somehow splits into zero words
  - practically unreachable since `voiceover_lines.text` always comes from the AI's generated script,
  but a composition can't render with no visual content on that track. Because the timing is
  even-per-word rather than real ASR, a steadily-paced take stays in sync noticeably better than one
  with long pauses or a rushed ending - so `FilmingModeFlow.tsx`'s voiceover step now shows a small
  hint ("Read it at a steady, even pace...") directly under the line's script, right where the person
  is about to hit record. This is UX guidance for a real technical constraint, not filler copy - if
  real word-level ASR timing is ever added, this hint stops being necessary and should come out with
  it. The same variety pass above also touched captions, purely as styling on top of the existing
  word-by-word mechanism (no new AI call, no schema change): every word gets a quick scale+fade
  pop-in (`WORD_POP_SECONDS`, 100ms, `quadratic-out` easing - confirmed against Creatomate's docs
  before use, not guessed) instead of just appearing, since a punch-in per word is the single most
  recognizable "this looks professionally captioned" tell real caption apps use. Any word containing
  a digit (`hasDigit()` - "50%", "3 minutes", "24/7") is emphasized: bigger and rendered in
  `EMPHASIS_COLOR`, a hex value hand-kept in sync with `--primary`'s light-mode value, same as the
  two other places (`icon.svg`, `Logo.tsx`) that can't reference the CSS variable directly. Numbers
  were picked as the emphasis heuristic specifically because it needs no AI call to judge which words
  actually matter in a line - a "longest word" or similar fuzzier heuristic risks emphasizing the
  wrong word and reading as arbitrary noise instead of intentional design; if smarter (AI-picked)
  emphasis is ever wanted, that's a real schema/prompt change to `generateVideoDetail.ts`, not a
  drop-in swap. The hook (first) line also gets a bigger base font size and a punchier pop
  (`HOOK_WORD_POP_START_SCALE`, 50% vs the usual 70%) to match the first clip's bigger zoom push -
  the first ~3 seconds is what stops the scroll, so it gets more visual weight than the rest of the
  video. Source clips are read via signed URLs from the private `clips` bucket
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
- `src/components/features/dashboard/TipOfTheDay.tsx` - a short tip shown at the bottom of the
  dashboard, below the card grid, picked deterministically from a fixed list by day-of-year
  (`Date.UTC`-based, no client state) so it's stable across refreshes without needing to persist
  anything. Tips are specifically about getting more out of Blueprint Studio's own features
  (regenerating a single card, word-by-word auto-edit captions and the steady-pace recording tip that
  supports them, QR auto-login, in-browser voiceover recording, the auto-edit trigger and its
  script-sourced captions, cross-page render notifications,
  the editing-suggestions field) rather than generic filming/social-media advice - each one should be
  checkable against a real feature. Unboxed - a `border-t` hairline divider and plain text rather than
  its own bordered card, since it's a minor aside, not primary content; originally sat boxed at the
  *top* of the page, but a client complaint that the dashboard felt cluttered moved it here and
  dropped the border. `WeekProgress.tsx` got the same treatment for the same reason: it's now a slim
  unboxed stat line (label + a `Progress` bar capped at `max-w-40`) directly under the `PageHeader`
  instead of its own bordered section - between the old boxed tip and boxed progress bar, the page had
  three stacked bordered containers before reaching the actual card grid, which read as noisy/dense
  rather than clean. The dashboard's sticky nav header (`(dashboard)/layout.tsx`) also had its
  `backdrop-blur-sm`/`bg-canvas/80` translucency dropped for a plain solid `bg-canvas` in the same
  pass - glassmorphism is meant to stay scoped to the login page exception (see "Design language"
  below), and a blurred nav bar was drift from that rule, not an intentional second exception.
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
- **Error monitoring** (`src/instrumentation.ts`, `src/instrumentation-client.ts`,
  `src/sentry.server.config.ts`, `src/sentry.edge.config.ts`, `src/app/global-error.tsx`,
  `next.config.ts`) - `@sentry/nextjs`, wired following the exact same optionality pattern as
  `CREATOMATE_API_KEY`/`MOCK_AI`/`MOCK_BILLING` above: every `Sentry.init()` call is gated behind
  `NEXT_PUBLIC_SENTRY_DSN`, so with it unset (the default in dev/CI/this repo) nothing is ever
  initialized and nothing is ever reported - confirmed by a full production build with no DSN set
  producing identical route output to before. One env var covers client, server, and edge - a Sentry
  DSN isn't secret (it's meant to ship in a public bundle, like a Stripe publishable key), so there's
  no need for a separate server-only variable. `next.config.ts`'s `withSentryConfig` wrap (which
  handles source map upload via `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN`) is itself skipped
  entirely when the DSN is unset, rather than always wrapping with empty org/project - so a build
  with no Sentry account configured never touches the Sentry build plugin at all, nothing to fail
  even without an auth token. `global-error.tsx` is Sentry's documented App Router pattern for
  catching errors that escape a route's own `error.tsx` boundary (this app doesn't have any yet -
  none of its routes have historically needed one) - `Sentry.captureException` inside it is the same
  no-op-without-a-client as everywhere else. One accepted tradeoff, not a bug: the client SDK import
  in `instrumentation-client.ts` is static (Next.js's own documented pattern - it needs a real
  `onRouterTransitionStart` function reference synchronously, so it can't be lazily imported behind
  the DSN check the way the `.init()` call itself is), so `@sentry/nextjs`'s base client bundle ships
  to every visitor's browser regardless of whether Sentry is configured, adding real weight to First
  Load JS - standard, documented behavior for any Next.js app that integrates Sentry at all, not
  something specific to how this was wired. Deliberately left off session replay and the feedback
  widget integrations Sentry's own setup docs default to - both are much heavier and neither was
  asked for; this is bare exception/error capture only.
- **Rate limiting** (`src/lib/rateLimit.ts`, `rate_limit_events` table -
  `supabase/migrations/0006_rate_limit_events.sql`) - per-user throttling on the four routes that hit
  a real paid API: `POST /api/plans/[businessId]/generate` (regenerate/retry path only - a plain
  generate against an already-`ready` plan returns the cached plan without touching Claude, so that
  path isn't counted), `POST /api/cards/[cardId]/generate-detail` (only the first, real generation per
  card counts - a card that already has a `video_details` row returns it directly), `POST
  /api/cards/[cardId]/regenerate` (every call is both a real Claude call *and* destructive - it wipes
  the card's existing detail/shots/clips - so this gets the tightest limit), and `POST
  /api/cards/[cardId]/render` (every submission spends real render-provider credits - a finite trial
  balance, then real money; the `GET` status-polling handler on the same route is deliberately not
  throttled, since polling never triggers a new render). Backed by a plain append-only Postgres table
  (`assertNotRateLimited` counts a user's rows for a given action in a trailing window, then inserts
  one) rather than an in-memory counter or a new caching layer like Redis/Upstash - an in-memory count
  isn't reliable across separate serverless function instances, and these are already deliberately
  occasional, expensive actions where a database round trip's latency is a non-issue. `rate_limit_events`
  is owner-scoped via RLS like most tables here (not the zero-policy service-role-only pattern
  `qr_login_tokens`/`stripe_events` use) - there's nothing sensitive about a user seeing their own
  throttle timestamps - but only `select`/`insert` policies exist, deliberately no `update`/`delete`,
  so a user can't clear their own history to defeat the limit via direct PostgREST access. Limits are
  deliberately generous enough not to interfere with real usage (a business only has 5-10 cards/week
  to begin with) while still bounding worst-case cost from a stuck retry loop or a scripted abuse
  attempt: plan generate 5/10min, card detail generate 15/10min, card regenerate 5/10min, render
  submit 5/15min. A limited user gets a plain 429 with a "too many requests" message - every calling
  component already surfaces `body.error` from a non-2xx response as a toast (the same generic
  fetch-error-handling pattern every mutation in this app already uses), so no client-side changes
  were needed for the message to show up correctly.
- **Settings/Billing de-templating pass** - these two pages had the same "looks AI-made" tells as the
  screens covered by the earlier systematic pass (see the addendum below) but were explicitly out of
  scope for it at the time; addressed here. `EditBusinessForm.tsx` was previously one flat `space-y-4`
  stack of 9 fields with `shadow-sm`; it's now grouped into 3 labeled sections ("About you & your
  business", "Your offering", "Brand") separated by `border-t border-border-subtle pt-6` dividers,
  matching the card detail page's Zone 3 consolidated-card pattern (one bordered shell, dividers
  between logical groups, not one box per field). `billing/page.tsx`'s plan-details box and
  `TestTierSwitcher.tsx`'s dev-only banner both dropped to plain `rounded-xl` with no `shadow-sm`,
  matching the rest of the app's "borders over shadows" rule.
- **Landing page trust signal + FAQ** - added per an explicit client request for social proof, with an
  equally explicit instruction not to fabricate anything. There's no real customer base yet
  (pre-launch), so rather than invent testimonials/logos/customer counts, this is grounded entirely in
  real, already-shipped functionality: a short trust-signal line under the hero CTA ("Cancel anytime ·
  Your data stays private · Secure billing via Stripe" - each claim traceable to actual code: Stripe
  Billing Portal cancellation, the `clips` bucket's RLS, Stripe Checkout), and a `FAQS`-array-driven
  `#faq` section (linked from the header nav) answering questions about the real product only -
  Filming Mode's no-experience-needed design, the auto-edit using real filmed clips (not synthetic AI
  video), single-card regenerate, clip privacy, cancellation, and music being explicitly out of scope
  for now (matching the "Music is explicitly out of scope" note at the top of this file, not glossing
  over it). If a testimonial/logo section is ever added for real, it needs actual customers first -
  don't backfill placeholder ones.
- **Custom 404** (`src/app/not-found.tsx`) - a real designed page instead of the framework default,
  reusing existing primitives rather than introducing new ones: the same `.bg-blueprint-grid` texture
  used on the dashboard empty state/landing/onboarding as a full-page backdrop, a plain (unchipped)
  `Clapperboard` icon and a giant `font-display` (Archivo Black) "404" numeral as the one heavy display
  moment for this screen, and the same hover-arrow micro-interaction as every other primary CTA in the
  app. Copy leans into the video-production theme ("This scene didn't make the cut") rather than generic
  404 copy. Deliberately does *not* reuse the login page's glassmorphism card/glow-orb treatment - that
  stays scoped to the documented login exception, not a pattern to spread further. Renders outside the
  `(dashboard)` layout (no nav header) since Next.js resolves the nearest `not-found.tsx` boundary
  upward from wherever `notFound()` was called or a route fails to match, and there's no group-local one
  - so both CTAs are real links (`/dashboard`, `/`) rather than relying on any layout chrome being
  present. Covers both genuinely unmatched routes and this app's existing explicit `notFound()` calls
  (bad `cardId` on the card detail/Filming Mode pages) for free, no route-specific wiring needed. Note:
  middleware redirects *unauthenticated* requests on any non-public path to `/login` before Next.js gets
  a chance to 404, so a logged-out visitor hitting a typo'd URL lands on login, not this page - this page
  is reached by signed-in users (bad in-app link, stale bookmark, mistyped path) and by anyone hitting a
  public-path 404, which is existing routing behavior this change doesn't alter.
- The whole-week **`RegeneratePlanButton`**'s confirm button (`GeneratePlanButton.tsx`) now shows the
  same pulsing `Sparkles` icon next to "Regenerating…" as `GeneratePlanButton`'s own initial-generate
  loading state and `DetailGenerator.tsx` - it was the one AI-generation trigger in the app still using
  bare text for its loading state, called out as a follow-up in an earlier pass. The per-card
  `RegenerateCardButton.tsx` has the identical bare-text gap but is out of scope here since only the
  whole-plan button was asked for; worth the same fix in a future pass for consistency.
- **Admin dashboard + video feedback** (`src/app/(dashboard)/admin/page.tsx`, `src/lib/admin.ts`,
  `src/components/features/video-detail/VideoRating.tsx`,
  `src/app/api/render-jobs/[jobId]/rating/route.ts`, `video_ratings` table -
  `supabase/migrations/0007_video_ratings.sql`) - the operator's own view of every business on the
  platform (plan, billing status, $ paid) plus a thumbs up/down feedback loop on finished videos,
  requested together since the ratings are meant to surface *on* the admin view, not just be captured.
  **Access control**: there's no staff/roles table in this app (one business row per customer, no
  concept of "not a customer but still a real user"), so `/admin` is gated by a plain `ADMIN_EMAILS`
  env var (comma-separated, checked case-insensitively in `src/lib/admin.ts`'s `requireAdmin()`) rather
  than a new schema - same optionality shape as `CREATOMATE_API_KEY`/`MOCK_BILLING`, but for
  authorization instead of a feature toggle. Unset, `/admin` is unreachable by anyone (redirects to
  `/dashboard`). `src/lib/supabase/middleware.ts` exempts `/admin` from the usual "signed in but no
  business row -> force `/onboarding`" redirect, since the operator's own account isn't a customer and
  won't have one; the real gate is `requireAdmin()` itself, not the middleware bypass. `DashboardNav`
  only shows the "Admin" link when `(dashboard)/layout.tsx` (now an async Server Component) resolves
  the signed-in user's email against the same allowlist - a non-admin never sees the link exists,
  though the page itself is the actual security boundary, not link visibility. **Data access**: the
  page reads across every business via `createAdminClient()` (the service-role client, previously used
  only by the Stripe webhook and QR login) instead of the request-scoped client every other page in
  this app uses - this is the one page deliberately not RLS-scoped to a single user, and pulls owner
  emails via `admin.auth.admin.listUsers()` since `businesses` has no email column of its own (Supabase
  Auth already owns that). Shows a stat row (business count, paying count, MRR - computed from
  `PLAN_TIERS` prices, not a stored dollar figure that could drift), a businesses table (plan, billing
  status via the same `StatusBadge`/`SUBSCRIPTION_STATUS_LABELS` the billing page uses, now factored
  into `src/lib/plans.ts` so the two can't disagree on how a status reads), and a recent-feedback feed.
  **The rating itself**: `VideoRating.tsx` sits at the bottom of a completed render in
  `RenderVideoPanel.tsx` - thumbs up/down, and clicking down reveals an optional feedback textarea
  (skippable; the down vote itself is already saved the moment it's clicked, feedback is a separate,
  optional follow-up send). One rating per **render job**, not per video card - a card can be
  re-rendered, and each render is its own edit worth its own rating (`video_ratings.render_job_id` is
  unique; rating the same job again upserts in place rather than duplicating). Every submission
  replaces both fields together (rating + feedback), so switching from a down-vote-with-feedback back
  to thumbs-up also clears the now-stale feedback text rather than leaving it orphaned. `GET
  /api/cards/[cardId]/render` joins in the job's rating (`withRating()`) so the panel gets the saved
  state for free on load/poll instead of a second request; the card detail page does the equivalent
  join server-side for the initial page load. `video_ratings` is owner-scoped via RLS the same "for
  all" pattern `render_jobs` itself uses (a business can only see/write its own ratings) - the admin
  dashboard's cross-tenant read goes through the service-role client instead, same as everywhere else
  on that page.

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
plus one accent (`--primary`, a blue - `oklch(0.6 0.152 255)` light / `oklch(0.68 0.16 255)` dark,
per explicit client request; originally a warm terracotta/rust at the same lightness/chroma with hue
40/42, swapped to hue 255 and nowhere else - every other token, and the whole rest of this section,
is unchanged) defined in `src/app/globals.css`. Everything derives from the single `--primary` CSS
variable via `color-mix(in oklch, var(--primary) ...)` (the blueprint-grid pattern, glow orbs, ring
colors, hover-lift shadows), so the swap cascades automatically everywhere except two places that
can't reference a CSS variable and hardcode the same OKLCH value directly: `src/app/icon.svg` (the
favicon) and `Logo.tsx` (the in-app wordmark SVG, which `InteractiveLogo.tsx` wraps) - keep those two
in sync with `--primary` by hand if the accent ever changes again. **Radius is tiered on purpose,
not uniform** - functional UI (buttons, inputs, badges) stays at the shadcn default `--radius-lg`
(10px); **every bordered content section uses one value, `rounded-xl`** (pricing/onboarding cards,
the card detail page's Hook/reference/"Ready to post" sections, Filming Mode's step card, `RenderVideoPanel`)
so there's a single, consistent "card container" affordance instead of three or four radii competing
for the same job; `rounded-2xl` is reserved for exactly one genuinely-elevated showcase panel per
screen (the landing hero/features browser-chrome mockups, the card page's "Ready to film?" CTA banner
specifically as a nav/CTA element rather than a content-display section, the login glass card).
**No monospace face anywhere in the app** - section eyebrows and small technical labels (`STEP 2 OF
5`, day-of-week tags, the landing page's section kickers, the card detail page's `Script`/`Shot list`/
etc. `h2` labels) previously used IBM Plex Mono (`font-mono`) to differentiate from body text, dropped
per explicit client feedback that it read as unprofessional. They're differentiated the same way now
as before, just without a typeface switch: small size (`text-xs`), uppercase, `tracking-wide`, and
either `text-primary` or `text-text-secondary` depending on emphasis - the same visual hierarchy, one
fewer typeface. **Type system**: body copy is Work Sans (`--font-sans`); all
headings (`h1`-`h6`, site-wide via a `@layer base` rule in `globals.css` rather than a class added to
every heading individually) are Archivo (`--font-heading`/`--font-archivo`) for more presence than
the body face without going all the way to a display weight everywhere - this now includes the
`h2` eyebrow labels too, which used to need an explicit `font-mono` override to opt out of this rule
and no longer do, since there's nothing left to opt out to. The landing page's hero `h1`
specifically uses Archivo Black (`--font-display`/`--font-archivo-black`, applied via the `font-display`
utility class) for one heavier, more declarative moment - Archivo Black is a single fixed weight, so
it's reserved for that one large headline rather than blanket-applied to every heading (at smaller
sizes, or combined with a `font-semibold`/`font-bold` utility, a single-weight face either does
nothing extra or risks the browser faux-bolding an already-black face). Borders over shadows for
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
terminal/transient result icons (Filming Mode's all-done/`justCompleted` states,
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
principle. The landing header (`src/app/page.tsx`) is `sticky top-0 z-50` with a solid `bg-canvas` (not
translucent - this app's one glassmorphism exception stays scoped to the login page) so it stays
legible and present while scrolling instead of just being a static strip at the very top; it also
carries a real nav (`How it works`/`Features`/`Pricing`, anchor-linking to each section's `id`) plus a
`Sign in` + `Get started` button pair rather than a single ghost-button link - a client complaint that
the bar felt "too plain/sparse" and "didn't feel premium." On mobile the nav links and `Sign in` both
drop (`hidden sm:flex`/`hidden sm:inline-flex`), leaving just the logo and `Get started` rather than
cramming everything into a narrow strip. Interactive cards (video tiles, feature/pricing cards) use the `.hover-lift`
utility (`globals.css`) - a small translateY + accent-tinted shadow on hover, not a decorative fade,
skipped under `prefers-reduced-motion`. Dark-first via `next-themes` (`defaultTheme="dark"`), with a
user-facing toggle (`src/components/design-system/ThemeToggle.tsx`, in the dashboard nav) switching
`resolvedTheme` between `dark`/`light` - both palettes are fully defined in `globals.css`, so this is
just wiring, not new tokens. The `@layer base` color-transition rule scopes `transition-colors` to
`*:not(svg *)` rather than a bare `*` - Lucide icons' inner `<path>`/`<line>`/`<circle>` nodes never
carry their own color (they inherit `currentColor` from the icon root), so transitioning them
individually was pure overhead with zero visual benefit, and icons are used constantly throughout the
app - on a client report that the dark/light toggle felt "choppy," this (not the 150ms duration itself)
was the actual fix: too many elements animating at once on every toggle, not a too-slow transition.
`.bg-blueprint-grid` also explicitly transitions `background-image` (not covered by `transition-colors`
at all) so its line colors crossfade instead of snapping against the smoothly-fading canvas color
around them - the two gradient states are structurally identical (same stops, only the `color-mix`
inputs change), so browsers can interpolate between them. `src/components/providers.tsx`'s
`LIGHT_ONLY_PATHS` (`/`, `/login`, `/onboarding`, `/privacy`) forces `light` via `ThemeProvider`'s
`forcedTheme` on the landing page, login, onboarding, and the privacy policy - there's no toggle on any
of them, so dark mode would just be an unstyled/unintended
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
logo mark on the landing header, login, privacy, and reset-password pages gets a small glossy
highlight (`.logo-shine`, blended with `mix-blend-mode: overlay` so it reads as light on a glossy
surface rather than a flat white smudge) clipped to the mark's own rounded-square shape via a wrapping
`overflow-hidden` span. It tracks `window` mousemove rather than a parent element - unlike
`MouseShine`, there's only ever one logo per page, so there's no risk of multiple instances needing
independent tracking. Plain `Logo.tsx` (no client-side behavior) is still used as-is anywhere the
shine wasn't requested, e.g. the dashboard nav.

`Parallax.tsx` (same directory, same ref-mutation pattern as `MouseShine`) adds a subtle scroll-linked
vertical drift to the landing page's two browser-chrome mockups (the hero's dashboard preview and the
Features section's card-detail preview) - a client request for "parallax scrolling." Went through a
second pass turning it up (clamp raised to +/-80px, speeds to `0.3`/`-0.25`) per feedback that it wasn't
noticeable enough, then back down to the original +/-28px clamp and `0.1`/`-0.08` speeds per a follow-up
"it's too much" - both tuning passes are one-line changes (the clamp in `Parallax.tsx`, the `speed` prop
at each call site), not a rewrite, if it needs adjusting again. Reads the element's own position relative
to the viewport center on `scroll`/`resize` (rAF-throttled) and writes `translateY` directly via
`el.style.transform`, clamped to a fixed range regardless of how far the element is from the viewport so
a long scroll doesn't send it drifting arbitrarily far. The two mockups use opposite-sign `speed` values
so they drift in opposite directions as
you scroll past them, reading as independent layers rather than the whole page moving in lockstep. Wraps
around each mockup's existing entrance animation (`animate-in`/`Reveal`) as an outer layer rather than
setting `transform` on the same element that animation targets - both are CSS-driven (keyframes/
transitions) and would otherwise fight the directly-set inline style for the same property. Skipped
entirely under `prefers-reduced-motion`, same as this app's other ambient animations; unlike
`MouseShine`, it works fine on touch devices too, since it's driven by `scroll` rather than `mousemove`.

**Exception - the login page.** `src/app/(auth)/login/page.tsx` (and `src/app/auth/reset-password/
page.tsx`, which reuses the identical markup as the natural continuation of the same auth flow)
intentionally breaks from the rest of this section per explicit client request: a "Liquid Glass"
floating card (`backdrop-blur`, translucent `bg-white/10`/`dark:bg-white/[0.06]` fills, `rounded-3xl`,
inset highlight via `shadow-[...inset...]`) over a full-bleed `.bg-blueprint-grid` background with two
blurred `bg-primary` glow orbs for depth. This is the one place in the app that uses glassmorphism and
a radius above `--radius-lg` - don't "fix" it back to the neutral/thin-border/capped-radius system used
everywhere else; that's a deliberate, asked-for departure for this screen specifically, not drift.
