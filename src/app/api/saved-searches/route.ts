import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  name: z.string().min(1),
  query: z.string().min(1),
  categoryId: z.string().optional(),
  maxPrice: z.number().positive().optional(),
  minProfit: z.number().optional(),
  minROI: z.number().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  const searches = await db.savedSearch.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ savedSearches: searches });
}

export async function POST(req: NextRequest) {
  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid saved search', details: parsed.error.flatten() }, { status: 400 });
  }
  const user = await getCurrentUser();

  const savedSearch = await db.savedSearch.create({
    data: { userId: user.id, ...parsed.data },
  });

  return NextResponse.json({ savedSearch });
}
