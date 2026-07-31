import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const UpdateSchema = z.object({
  alertsEnabled: z.boolean(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
  }
  const savedSearch = await db.savedSearch.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ savedSearch });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.savedSearch.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
