import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { searchEbayListings, EbayNotConfiguredError, type EbaySearchResult } from '@/lib/ebay';
import { quickScoreListings } from '@/lib/ai';
import { sendDealAlertEmail, EmailNotConfiguredError, type AlertDeal } from '@/lib/email';
import { computeFinancialsFromRange } from '@/types/flip';
import type { SavedSearch, User } from '@prisma/client';

export const dynamic = 'force-dynamic';
// Vercel Hobby caps function duration lower than Pro - raise this (or split
// into batches) if you're checking many saved searches per run.
export const maxDuration = 60;

type SavedSearchWithUser = SavedSearch & { user: User };

async function runSavedSearch(search: SavedSearchWithUser): Promise<number> {
  let results: EbaySearchResult[];
  try {
    results = await searchEbayListings({
      query: search.query,
      categoryId: search.categoryId ?? undefined,
      maxPrice: search.maxPrice ?? undefined,
      limit: 24,
    });
  } catch (err) {
    if (err instanceof EbayNotConfiguredError) return 0;
    throw err;
  }
  if (results.length === 0) return 0;

  const alreadyAlerted = await db.alertedListing.findMany({
    where: { savedSearchId: search.id, ebayItemId: { in: results.map((r) => r.ebayItemId) } },
    select: { ebayItemId: true },
  });
  const seen = new Set(alreadyAlerted.map((a) => a.ebayItemId));
  const unseen = results.filter((r) => !seen.has(r.ebayItemId));

  // Record every unseen item as alerted regardless of score, so a listing
  // that scores too low to notify on today is never re-evaluated tomorrow.
  if (unseen.length > 0) {
    await db.alertedListing.createMany({
      data: unseen.map((r) => ({ savedSearchId: search.id, ebayItemId: r.ebayItemId })),
      skipDuplicates: true,
    });
  }
  await db.savedSearch.update({ where: { id: search.id }, data: { lastRunAt: new Date() } });

  if (unseen.length === 0) return 0;

  const scores = await quickScoreListings(
    unseen.map((r) => ({ id: r.ebayItemId, title: r.title, price: r.price, condition: r.condition, category: r.categoryName }))
  );
  const scoreById = new Map(scores.map((s) => [s.id, s]));

  const deals: AlertDeal[] = unseen
    .map((r) => {
      const score = scoreById.get(r.ebayItemId);
      if (!score) return null;
      const financials = computeFinancialsFromRange(r.price, score.estimatedResaleValueLow, score.estimatedResaleValueHigh);
      if (search.minProfit != null && financials.estimatedProfit < search.minProfit) return null;
      if (search.minROI != null && financials.roi < search.minROI) return null;
      return {
        title: r.title,
        price: r.price,
        estimatedProfit: financials.estimatedProfit,
        roi: financials.roi,
        flipScore: Math.round(score.flipScore),
        itemWebUrl: r.itemWebUrl,
      };
    })
    .filter((d): d is AlertDeal => d !== null)
    .sort((a, b) => b.flipScore - a.flipScore);

  if (deals.length === 0) return 0;

  try {
    await sendDealAlertEmail({ to: search.user.email, savedSearchName: search.name, deals });
  } catch (err) {
    if (!(err instanceof EmailNotConfiguredError)) {
      console.error(`Failed to send alert email for saved search ${search.id}`, err);
    }
  }

  return deals.length;
}

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const searches = await db.savedSearch.findMany({ where: { alertsEnabled: true }, include: { user: true } });

  const results = [];
  for (const search of searches) {
    try {
      const newDeals = await runSavedSearch(search);
      results.push({ savedSearchId: search.id, newDeals });
    } catch (err) {
      console.error(`Saved search ${search.id} failed`, err);
      results.push({ savedSearchId: search.id, error: true });
    }
  }

  return NextResponse.json({ checked: searches.length, results });
}
