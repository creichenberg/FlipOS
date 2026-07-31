import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { seedDemoFlips } from '@/lib/demoData';

export const dynamic = 'force-dynamic';

// Temporary alternative to `npm run db:seed` for populating the live
// database straight from a browser, without needing a local dev setup -
// visit this URL while logged into Vercel (same as /api/debug/env) to seed
// against whatever DATABASE_URL the deployment is actually running with.
// Requires ?run=yes so a stray link-preview crawler can't trigger it by
// just fetching the URL. Safe to re-run - it replaces the demo user's
// listings each time rather than piling up duplicates. Delete this route
// once you have real data flowing in.
export async function GET(req: NextRequest) {
  const confirmed = req.nextUrl.searchParams.get('run') === 'yes';
  if (!confirmed) {
    return NextResponse.json({
      message: 'Add ?run=yes to this URL to seed 20 demo flips into the live database.',
    });
  }

  const user = await getCurrentUser();
  const count = await seedDemoFlips(db, user.id);

  return NextResponse.json({ ok: true, seeded: count, user: user.email });
}
