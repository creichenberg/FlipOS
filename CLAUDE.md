# FlipOS

AI-powered flip analysis for resellers. Upload a listing (or, in Phase 2, search eBay) and get
a Flip Score, a buy/negotiate/pass call, and a ready-to-post selling plan. Full product spec and
rationale: see `README.md`.

## Status

Phase 1 is built: upload listing → Claude analysis (tool-use, forced JSON) → Flip Score →
financials/risk/buying/selling strategy → save and track through sold.

Phase 2 is built: `/search` searches live eBay listings (Browse API, client-credentials OAuth),
quick-scores a page of results in one batched Claude call (`quickScoreListings()` in
`src/lib/ai.ts`), ranks/filters by category/min-max price/condition/min profit/min ROI, and lets
a result be promoted into the full `analyzeListing()` flow with one click. A "near me" toggle
(ZIP + local-pickup-only, sorted by distance) is also in `searchEbayListings()`. `UserPreference`
now backs save-able default filters via `src/app/api/preferences/route.ts`. `/upload` also takes
a pasted listing URL (`/api/listing/lookup`) - eBay via `getEbayItemByLegacyId()`, anything else
best-effort via Open Graph/JSON-LD scraping (`src/lib/listingLookup.ts`) - to prefill the form
instead of typing everything by hand.

Phase 3 (deal alerts) is built: `SavedSearch` is a standing eBay query a user creates from
"Save as alert" on `/search`. `src/app/api/cron/deal-alerts/route.ts` - triggered by Vercel Cron,
see `vercel.json` - re-runs every enabled saved search, quick-scores new results, dedupes against
`AlertedListing` (unique per `savedSearchId`+`ebayItemId`, so nothing is emailed twice), and
sends matches via Resend (`src/lib/email.ts`). Listings now carry real photos too:
`resolveImageUrls()` in `src/app/api/analyze/route.ts` uses the user's upload, or the source eBay
listing's photo, or (as a last resort) a quick eBay search-by-product-name lookup. Not yet
started: more marketplace integrations, portfolio analytics.

## Non-negotiable design decisions - don't relitigate these without discussion

- **Zod is the single source of truth** for the AI output shape (`src/types/flip.ts`). It drives
  the Claude tool schema, API request validation, and TS types. If the analysis shape needs to
  change, change it there first and let type errors point at everything else to update.
- **Profit/ROI are always computed in code**, never trusted raw from the model. See
  `computeFinancials()` in `src/types/flip.ts`.
- **No chatbot UI.** This is a deal-cards-and-numbers product, not an "ask AI anything" screen.
  Keep new UI in that register - see the Design section below.
- Auth is intentionally a stub (`src/lib/auth.ts`, single demo user) until the product loop is
  validated. Don't build auth UI without discussing first - the swap-in path for NextAuth is
  documented in that file.

## Design language

Light, near-monochrome, card-and-pill UI modeled directly on a specific reference (a travel-app
mockup the product owner supplied) - not a generic dark SaaS look. Warm light-gray page
background (`canvas`, `#F1EFEC`), white card surfaces (`card`) separated by soft shadow
(`shadow-soft`/`shadow-tight`) instead of borders, near-black `ink` for all text and every solid
button/pill/selected state, one gray (`graphite`) for secondary text. Color is reserved for
exactly two things: profit (`profit`, green) and loss/pass (`risk`, red) figures - nothing else
is colored, no per-category chip palette. Large rounded corners on cards (`rounded-card`, 28px),
full pill radius on every button/search field/filter chip/nav. One typeface (Inter) for
everything; money figures use `tabular-nums`, not a monospace font. Flip Score is a small
rating-chip (`FlipScoreBadge.tsx`) - a tier-colored dot plus the number, echoing the reference's
star-rating treatment. Mobile gets a floating black pill bottom-nav (`MobileNav.tsx`, `sm:hidden`)
matching the reference's mobile nav pattern; the top `Nav.tsx` link cluster is desktop-only
(`hidden sm:inline`). Reusable primitives - `.surface`, `.pill-primary` (solid black), `.pill-secondary`
(white + shadow), `.icon-btn`, `.field` / `.field-pill` - live in `src/app/globals.css`
`@layer components`; reach for those before writing new one-off styling. Full tokens in
`tailwind.config.ts`. Two prior directions (a dark "paper index-card" look and a dark "Apple
Wallet" glassmorphism look) were tried and explicitly rejected as generic/AI-slop - don't revert
to either without discussion.

## Commands

```bash
npm run dev        # start dev server
npm run db:push     # sync prisma/schema.prisma to the database
npm run db:seed     # add 2 sample flips
npm run db:studio   # inspect data
```

## Key files to read before touching AI logic

- `src/lib/ai.ts` - the Claude calls (`analyzeListing()` for full analysis, `quickScoreListings()`
  for batched Phase 2 search triage), system prompts, and tool schemas
- `src/types/flip.ts` - the shared schema/types (`FlipAnalysisSchema` for full analysis,
  `QuickScoreSchema` for triage; both feed `computeFinancialsFromRange()`)
- `src/app/api/analyze/route.ts` - how a full analysis becomes DB rows, and how a listing photo
  gets resolved (`resolveImageUrls()`)
- `src/lib/ebay.ts` - eBay Browse API client (OAuth token cache + search), used by
  `src/app/api/ebay/search/route.ts` and the cron job
- `src/app/api/cron/deal-alerts/route.ts` - the saved-search alert loop; `src/lib/email.ts` is
  the Resend send + template
