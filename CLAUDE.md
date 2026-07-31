# FlipOS

AI-powered flip analysis for resellers. Upload a listing (or, in Phase 2, search eBay) and get
a Flip Score, a buy/negotiate/pass call, and a ready-to-post selling plan. Full product spec and
rationale: see `README.md`.

## Status

Phase 1 is built: upload listing → Claude analysis (tool-use, forced JSON) → Flip Score →
financials/risk/buying/selling strategy → save and track through sold.

Phase 2 is built: `/search` searches live eBay listings (Browse API, client-credentials OAuth),
quick-scores a page of results in one batched Claude call (`quickScoreListings()` in
`src/lib/ai.ts`), ranks/filters by category/max price/min profit/min ROI, and lets a result be
promoted into the full `analyzeListing()` flow with one click. `UserPreference` now backs
save-able default filters via `src/app/api/preferences/route.ts`. Not yet started: Phase 3 (deal
alerts, more marketplaces).

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

Refined dark UI (Apple Wallet/Card register, not a generic SaaS dashboard or default-Tailwind
look): true-black page background (`#000000`) with a faint ambient radial glow, frosted-glass
card surfaces (`.glass-card` in `globals.css` - `bg-white/[0.06]` + `backdrop-blur`), hairline
borders instead of hard dividers, and one neutral display/body typeface (Inter) with weight and
tracking doing the hierarchy work instead of a second quirky display font. Monospace
(`font-mono`) is still used for all money figures. Flip Score is an Apple-activity-ring-style SVG
gauge (`FlipScoreBadge.tsx`), not a linear progress bar. Reusable primitives - `.glass-card`,
`.chip`, `.btn-primary` (solid off-white pill), `.btn-secondary` (glass outline pill), `.field`
(solid dark input) - live in `src/app/globals.css` `@layer components`; reach for those before
writing new one-off card/button/input styling. Full color/radius tokens in `tailwind.config.ts`.

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
- `src/app/api/analyze/route.ts` - how a full analysis becomes DB rows
- `src/lib/ebay.ts` - eBay Browse API client (OAuth token cache + search), used by
  `src/app/api/ebay/search/route.ts`
