import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PreferencesSchema = z.object({
  categories: z.array(z.string()).optional(),
  maxPurchasePrice: z.number().positive().nullable().optional(),
  minProfit: z.number().nullable().optional(),
  minROI: z.number().nullable().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  const preferences = await db.userPreference.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ preferences });
}

export async function PUT(req: NextRequest) {
  const parsed = PreferencesSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid preferences', details: parsed.error.flatten() }, { status: 400 });
  }
  const user = await getCurrentUser();

  const preferences = await db.userPreference.upsert({
    where: { userId: user.id },
    update: parsed.data,
    create: { userId: user.id, ...parsed.data },
  });

  return NextResponse.json({ preferences });
}
