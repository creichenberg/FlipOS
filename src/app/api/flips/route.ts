import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  const flips = await db.savedFlip.findMany({
    where: { userId: user.id },
    include: { analysis: { include: { listing: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(flips);
}

const SaveSchema = z.object({ analysisId: z.string() });

export async function POST(req: NextRequest) {
  const parsed = SaveSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'analysisId is required' }, { status: 400 });
  }

  const user = await getCurrentUser();

  const savedFlip = await db.savedFlip.upsert({
    where: { analysisId: parsed.data.analysisId },
    update: {},
    create: { userId: user.id, analysisId: parsed.data.analysisId },
  });

  return NextResponse.json(savedFlip);
}
