import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import AnalysisResult from '@/components/AnalysisResult';

export const dynamic = 'force-dynamic';

export default async function AnalysisPage({ params }: { params: { id: string } }) {
  const analysis = await db.flipAnalysis.findUnique({
    where: { id: params.id },
    include: { listing: true, savedFlip: true },
  });

  if (!analysis) notFound();

  return <AnalysisResult analysis={analysis} />;
}
