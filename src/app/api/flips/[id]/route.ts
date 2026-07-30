import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

const UpdateSchema = z.object({
  status: z.enum(['SAVED', 'PURCHASED', 'LISTED', 'SOLD']),
  purchasePrice: z.number().positive().optional(),
  actualSalePrice: z.number().positive().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
  }
  const { status, purchasePrice, actualSalePrice } = parsed.data;

  const now = new Date();
  const data: Prisma.SavedFlipUpdateInput = { status };

  if (status === 'PURCHASED') {
    data.purchasedAt = now;
    if (purchasePrice != null) data.purchasePrice = purchasePrice;
  }
  if (status === 'LISTED') {
    data.listedAt = now;
  }
  if (status === 'SOLD') {
    data.soldAt = now;
    if (actualSalePrice != null) {
      const flip = await db.savedFlip.findUnique({ where: { id: params.id } });
      const costBasis = purchasePrice ?? flip?.purchasePrice ?? undefined;
      data.actualSalePrice = actualSalePrice;
      if (costBasis != null) {
        data.actualProfit = actualSalePrice - costBasis;
        data.actualROI = costBasis > 0 ? ((actualSalePrice - costBasis) / costBasis) * 100 : null;
      }
    }
  }

  const updated = await db.savedFlip.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}
