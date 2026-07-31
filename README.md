# FlipOS

AI-powered flip analysis for resellers. Upload a listing, get a Flip Score, a buy/negotiate/pass
call, and a ready-to-post selling plan.

Phase 1 (upload → AI analysis → Flip Score → save/track) and Phase 2 (eBay Browse API search +
filters) are built. Deal alerts and more marketplaces (Phase 3) are stubbed out in the
architecture but not built yet.

## Stack

- **Next.js 14 (App Router) + React + TypeScript** - one deployable, server components for data
  fetching, API routes for mutations.
- **Tailwind CSS** - custom token set (see `tailwind.config.ts`), not default theme.
- **PostgreSQL + Prisma** - typed schema, migrations.
- **Anthropic API (Claude, tool use)** - forces structured JSON out of the model instead of
  parsing free text, and accepts listing photos directly for condition assessment.
- **Zod** - one schema (`src/types/flip.ts`) shared by the AI tool definition, the API request
  validation, and the TypeScript types. Change it once, everything else follows.

## Why this stack

- Next.js API routes + server components means no separate backend service to deploy for an MVP.
- Postgres over a NoSQL store because the data is genuinely relational (a listing has one
  analysis, an analysis can become one saved flip with a status history) and you'll want to run
  real aggregate queries later ("average ROI by category").
- Claude's tool-use forces the model to return exactly the shape the database expects, so a
  malformed response fails validation immediately instead of silently corrupting a row.

## Setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL and ANTHROPIC_API_KEY
npm run db:push           # create tables from prisma/schema.prisma
npm run db:seed           # optional: adds 2 sample flips so the homepage isn't empty
npm run dev
```

Open http://localhost:3000. Phase 1 runs on a single seeded demo account (see
`src/lib/auth.ts` for why, and how to swap in real multi-user auth later).

## Folder structure

```
src/
  app/
    page.tsx                 Homepage - "Today's Best Flips"
    upload/page.tsx           Upload a listing
    search/page.tsx           Find Deals - live eBay search + filters (Phase 2)
    analysis/[id]/page.tsx    Full Flip Score breakdown
    saved/page.tsx            Saved flips + status tracking
    api/
      analyze/route.ts        POST listing -> AI analysis -> DB row
      ebay/search/route.ts    POST search terms -> eBay results -> quick-scored deals
      preferences/route.ts    GET/PUT saved default search filters
      flips/route.ts          GET/POST saved flips
      flips/[id]/route.ts     PATCH status (saved/purchased/listed/sold)
  components/                 DealCard, EbayDealCard, SearchForm, FlipScoreBadge, UploadForm, etc.
  lib/
    ai.ts                     Claude calls (full analysis + batched quick-score) + tool schemas
    ebay.ts                   eBay Browse API client (OAuth token cache + search)
    ebayCategories.ts         Curated eBay category id list for the search filter dropdown
    auth.ts                   Current-user resolution (demo account for now)
    db.ts                     Prisma client singleton
  types/
    flip.ts                   Zod schemas = AI output shapes = TS types (single source of truth)
prisma/
  schema.prisma                Users, UserPreference, Listing, FlipAnalysis, SavedFlip
  seed.ts                       Demo user + sample flips
```

## Database design

Six models, matching the spec:

- **User** - just email/name for now; `preferences`, `listings`, `savedFlips` relations ready.
- **UserPreference** - one-to-one with User; category/price/ROI filters for Phase 2 deal search.
- **Listing** - the raw input (title, price, marketplace, description). One listing has at most
  one analysis.
- **FlipAnalysis** - everything the AI produces, plus `estimatedProfit`/`roi` computed in code
  (never trusted from the model, since they must be arithmetically consistent with the price and
  resale estimate). `rawModelOutput` keeps the full JSON for debugging/audit.
- **SavedFlip** - lifecycle tracking (`SAVED → PURCHASED → LISTED → SOLD`), with actual
  profit/ROI computed on sale from real purchase/sale prices, separate from the AI's estimate.
- **CompletedSale** is folded into `SavedFlip.status = SOLD` rather than a 6th table - a sale is
  a state a saved flip reaches, not a separate entity, and this avoids a join for the common
  "show me my flip history" query.

## Build plan status

- [x] **Phase 1** - Upload listing, AI analysis, Flip Score, financials, risk, buying + selling
      strategy, save/track through sold.
- [x] **Phase 2** - `/search` hits the eBay Browse API (client-credentials OAuth, cached token)
      with query/category/max price, quick-scores the page of results in one batched Claude
      call, ranks by Flip Score, and supports min profit/min ROI filters computed in code from
      those scores. A result can be promoted into the full `analyzeListing()` flow with one
      click. Default filters save to `UserPreference` via `/api/preferences`.
- [ ] **Phase 3** - Deal alerts (needs a cron/queue - Vercel Cron or a worker polling saved
      searches), more marketplace integrations, bulk/portfolio analytics.

## What's deliberately deferred (and why)

- **Full multi-user auth** - one demo account for now so the AI-analysis loop (the actual bet
  this product is making) could ship first. `src/lib/auth.ts` documents the exact swap-in path
  for NextAuth once you're ready for real users.
- **Photo storage** - uploaded photos are sent straight to Claude for analysis and not persisted
  to object storage yet. Add S3/Cloudflare R2 and store `imageUrls` on `Listing` before you need
  to show photos back to the user (e.g. in the saved flips list). eBay search results inherit
  this too - quick-scoring and the one-click full analysis run on title/price/condition only, no
  photos, until image fetching is wired up.

## Future improvements

- Real auth (NextAuth/Clerk) + per-user preference-driven homepage ranking.
- eBay Browse API integration behind `UserPreference` filters.
- Push/email deal alerts when a saved search finds a high Flip Score item.
- Photo storage + before/after condition comparison on sold flips.
- Portfolio analytics: win rate, average ROI by category, time-to-sell by platform.
- Batch analysis (paste a whole marketplace search results page at once).

## Monetization ideas

- **Subscription tiers** - free tier caps analyses/month; paid tier unlocks eBay deal search,
  alerts, and unlimited analyses.
- **Take rate on tracked sales** - optional, opt-in small fee on `SavedFlip.actualProfit` once a
  flip is marked sold (needs payment collection, so later-stage).
- **Category/niche packs** - curated alert feeds for specific categories (sneakers, cameras,
  power tools) as an upsell over generic search.
- **Affiliate/referral** on recommended selling platforms.
