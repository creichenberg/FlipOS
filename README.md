# FlipOS

AI-powered flip analysis for resellers. Upload a listing, get a Flip Score, a buy/negotiate/pass
call, and a ready-to-post selling plan.

Phase 1 (upload → AI analysis → Flip Score → save/track), Phase 2 (eBay Browse API search +
filters), and the deal-alerts half of Phase 3 (saved searches, cron-driven re-checks, email
notifications) are built. More marketplace integrations and portfolio analytics are still open.

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
    search/page.tsx           Find Deals - live eBay search + filters (Phase 2) + saved alerts
    analysis/[id]/page.tsx    Full Flip Score breakdown
    saved/page.tsx            Saved flips + status tracking
    api/
      analyze/route.ts            POST listing -> AI analysis -> DB row (also resolves a photo)
      ebay/search/route.ts        POST search terms -> eBay results -> quick-scored deals
      preferences/route.ts        GET/PUT saved default search filters
      saved-searches/route.ts     GET/POST saved alert searches
      saved-searches/[id]/route.ts  PATCH (toggle alerts) / DELETE a saved search
      cron/deal-alerts/route.ts   Vercel Cron target - re-runs saved searches, emails new matches
      flips/route.ts          GET/POST saved flips
      flips/[id]/route.ts     PATCH status (saved/purchased/listed/sold)
  components/                 DealCard, EbayDealCard, SearchForm, SavedSearchList, FlipScoreBadge,
                               UploadForm, Nav, MobileNav, etc.
  lib/
    ai.ts                     Claude calls (full analysis + batched quick-score) + tool schemas
    ebay.ts                   eBay Browse API client (OAuth token cache + search)
    ebayCategories.ts         Curated eBay category id list for the search filter dropdown
    email.ts                  Resend client + deal-alert email template
    auth.ts                   Current-user resolution (demo account for now)
    db.ts                     Prisma client singleton
  types/
    flip.ts                   Zod schemas = AI output shapes = TS types (single source of truth)
prisma/
  schema.prisma                Users, UserPreference, Listing, FlipAnalysis, SavedFlip,
                                SavedSearch, AlertedListing
  seed.ts                       Demo user + sample flips
vercel.json                     Cron schedule for /api/cron/deal-alerts
```

## Database design

- **User** - just email/name for now; `preferences`, `listings`, `savedFlips`, `savedSearches`
  relations ready.
- **UserPreference** - one-to-one with User; category/price/ROI *default filter values* pre-filled
  into the manual `/search` form. Not the same thing as a `SavedSearch` (see below).
- **Listing** - the raw input (title, price, marketplace, description, `imageUrls`). One listing
  has at most one analysis.
- **FlipAnalysis** - everything the AI produces, plus `estimatedProfit`/`roi` computed in code
  (never trusted from the model, since they must be arithmetically consistent with the price and
  resale estimate). `rawModelOutput` keeps the full JSON for debugging/audit.
- **SavedFlip** - lifecycle tracking (`SAVED → PURCHASED → LISTED → SOLD`), with actual
  profit/ROI computed on sale from real purchase/sale prices, separate from the AI's estimate.
- **CompletedSale** is folded into `SavedFlip.status = SOLD` rather than a separate table - a sale
  is a state a saved flip reaches, not a separate entity, and this avoids a join for the common
  "show me my flip history" query.
- **SavedSearch** - a standing eBay query (term + filters) the cron job re-runs on its own; created
  from `/search` via "Save as alert". Distinct from `UserPreference` above.
- **AlertedListing** - one row per eBay item ID already emailed for a given `SavedSearch`, so the
  cron job never re-alerts on the same listing twice. Unique on `(savedSearchId, ebayItemId)`.

## Build plan status

- [x] **Phase 1** - Upload listing, AI analysis, Flip Score, financials, risk, buying + selling
      strategy, save/track through sold.
- [x] **Phase 2** - `/search` hits the eBay Browse API (client-credentials OAuth, cached token)
      with query/category/max price, quick-scores the page of results in one batched Claude
      call, ranks by Flip Score, and supports min profit/min ROI filters computed in code from
      those scores. A result can be promoted into the full `analyzeListing()` flow with one
      click. Default filters save to `UserPreference` via `/api/preferences`.
- [x] **Phase 3 (partial)** - Deal alerts: `/api/cron/deal-alerts` (triggered by Vercel Cron, see
      `vercel.json`) re-runs every `alertsEnabled` `SavedSearch`, quick-scores new results the
      same way `/search` does, dedupes against `AlertedListing`, and emails matches via Resend
      (`src/lib/email.ts`). Create a saved search from the "Save as alert" button on `/search`.
      Still open: more marketplace integrations, bulk/portfolio analytics.

## What's deliberately deferred (and why)

- **Full multi-user auth** - one demo account for now so the AI-analysis loop (the actual bet
  this product is making) could ship first. `src/lib/auth.ts` documents the exact swap-in path
  for NextAuth once you're ready for real users.
- **Real object storage for photos** - `Listing.imageUrls` is populated (uploaded photos as data
  URIs, eBay-sourced or looked-up photos as plain URLs - see `resolveImageUrls()` in
  `src/app/api/analyze/route.ts`), so cards/analysis pages show real images. But uploaded photos
  are stored as base64 data URIs directly in Postgres, not in S3/R2 - fine at demo scale, but
  those rows get large fast and every query pulls the image bytes along with everything else.
  Move to S3/Cloudflare R2 (store a URL instead of the data URI) before this sees real traffic.
- **Alert cadence/volume controls** - the cron job alerts on every new match every run with no
  per-user rate limiting or digest batching. Fine for one demo user; add before multi-user launch
  so an active saved search can't spam someone hourly.

## Future improvements

- Real auth (NextAuth/Clerk) + per-user preference-driven homepage ranking.
- Move uploaded photos from in-DB data URIs to S3/Cloudflare R2.
- Alert digests (daily/weekly rollup instead of one email per cron run) and per-alert cadence.
- Portfolio analytics: win rate, average ROI by category, time-to-sell by platform.
- Batch analysis (paste a whole marketplace search results page at once).
- More marketplaces (Facebook Marketplace, Craigslist, OfferUp, Mercari) beyond eBay.

## Monetization ideas

- **Subscription tiers** - free tier caps analyses/month; paid tier unlocks eBay deal search,
  alerts, and unlimited analyses.
- **Take rate on tracked sales** - optional, opt-in small fee on `SavedFlip.actualProfit` once a
  flip is marked sold (needs payment collection, so later-stage).
- **Category/niche packs** - curated alert feeds for specific categories (sneakers, cameras,
  power tools) as an upsell over generic search.
- **Affiliate/referral** on recommended selling platforms.
