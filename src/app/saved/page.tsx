import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import SavedFlipsList from '@/components/SavedFlipsList';

export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  const user = await getCurrentUser();

  const flips = await db.savedFlip.findMany({
    where: { userId: user.id },
    include: { analysis: { include: { listing: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Saved Flips</h1>
      <p className="mt-1 text-sm text-graphite">Track a flip from saved through sold.</p>
      <div className="mt-6">
        <SavedFlipsList initialFlips={flips} />
      </div>
    </div>
  );
}
