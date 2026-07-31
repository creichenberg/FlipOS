'use client';

import { useState } from 'react';
import type { FlipAnalysis, Listing, SavedFlip } from '@prisma/client';
import FlipScoreBadge from './FlipScoreBadge';
import { FLIP_CATEGORY_LABEL } from '@/types/flip';

type AnalysisWithRelations = FlipAnalysis & { listing: Listing; savedFlip: SavedFlip | null };

const DECISION_STYLE: Record<string, string> = {
  BUY: 'bg-profit/10 text-profit',
  NEGOTIATE: 'bg-canvas text-ink',
  PASS: 'bg-risk/10 text-risk',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface p-5 text-ink">
      <h2 className="text-xs font-bold uppercase tracking-wider text-graphite">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function AnalysisResult({ analysis }: { analysis: AnalysisWithRelations }) {
  const [savedFlip, setSavedFlip] = useState(analysis.savedFlip);
  const [saving, setSaving] = useState(false);

  const resaleMid = Math.round((analysis.estimatedResaleValueLow + analysis.estimatedResaleValueHigh) / 2);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/flips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: analysis.id }),
      });
      if (res.ok) setSavedFlip(await res.json());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-graphite">
            {analysis.category} {analysis.listing.marketplace ? `· ${analysis.listing.marketplace}` : ''}
          </p>
          <h1 className="font-display text-2xl font-bold">{analysis.identifiedProduct}</h1>
          <p className="mt-1 text-sm text-graphite">{analysis.conditionAssessed}</p>
        </div>
        <FlipScoreBadge score={analysis.flipScore} category={analysis.flipCategory} />
      </div>

      <Section title="Buy Decision">
        <span className={`inline-block rounded-full px-3 py-1 font-display text-sm font-bold ${DECISION_STYLE[analysis.buyDecision]}`}>
          {analysis.buyDecision}
        </span>
        <p className="mt-3 text-sm leading-relaxed">
          {FLIP_CATEGORY_LABEL[analysis.flipCategory]} ({analysis.flipScore}/100) — {analysis.flipReasoning}
        </p>
      </Section>

      <Section title="Financial Analysis">
        <dl className="grid grid-cols-2 gap-y-3 text-sm tabular-nums sm:grid-cols-4">
          <div>
            <dt className="text-xs text-graphite">Current price</dt>
            <dd className="text-base font-semibold">${analysis.listing.askingPrice.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs text-graphite">Est. resale</dt>
            <dd className="text-base font-semibold">
              ${analysis.estimatedResaleValueLow.toLocaleString()}–${analysis.estimatedResaleValueHigh.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-graphite">Est. profit</dt>
            <dd className={`text-base font-semibold ${analysis.estimatedProfit >= 0 ? 'text-profit' : 'text-risk'}`}>
              {analysis.estimatedProfit >= 0 ? '+' : ''}${Math.round(analysis.estimatedProfit).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-graphite">ROI</dt>
            <dd className="text-base font-semibold">{analysis.roi.toFixed(1)}%</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-graphite">
          Confidence: <span className="font-medium text-ink">{analysis.confidence}</span> · Demand:{' '}
          <span className="font-medium text-ink">{analysis.demand}</span> · Competition:{' '}
          <span className="font-medium text-ink">{analysis.competition}</span>
        </p>
      </Section>

      <Section title="Risk Analysis">
        {analysis.riskFactors.length > 0 && (
          <ul className="list-disc space-y-1 pl-4 text-sm">
            {analysis.riskFactors.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
        {analysis.thingsToCheck.length > 0 && (
          <>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-graphite">Check before buying</p>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {analysis.thingsToCheck.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </>
        )}
        {analysis.whyUnderpriced && (
          <p className="mt-3 text-sm italic text-graphite">Why it&apos;s priced this way: {analysis.whyUnderpriced}</p>
        )}
      </Section>

      <Section title="Buying Strategy">
        {analysis.recommendedOfferPrice != null && (
          <p className="text-sm tabular-nums">
            Recommended offer: <span className="font-semibold">${analysis.recommendedOfferPrice.toLocaleString()}</span>
          </p>
        )}
        {analysis.negotiationMessage && (
          <div className="mt-2 rounded-control bg-canvas p-3 text-sm italic text-ink/90">
            &ldquo;{analysis.negotiationMessage}&rdquo;
          </div>
        )}
      </Section>

      <Section title="Selling Strategy">
        <dl className="grid grid-cols-2 gap-y-3 text-sm tabular-nums">
          <div>
            <dt className="text-xs text-graphite">Best platform</dt>
            <dd className="font-semibold">{analysis.bestPlatform}</dd>
          </div>
          <div>
            <dt className="text-xs text-graphite">List price</dt>
            <dd className="font-semibold">${analysis.recommendedSellPrice?.toLocaleString()}</dd>
          </div>
        </dl>
        {analysis.listingTitle && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-graphite">Suggested title</p>
            <p className="text-sm">{analysis.listingTitle}</p>
          </div>
        )}
        {analysis.listingDescription && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-graphite">Suggested description</p>
            <p className="text-sm leading-relaxed">{analysis.listingDescription}</p>
          </div>
        )}
        {analysis.keywords.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {analysis.keywords.map((k) => (
              <span key={k} className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink">
                {k}
              </span>
            ))}
          </div>
        )}
        {analysis.photosNeeded.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-graphite">Photos to take</p>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {analysis.photosNeeded.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <button onClick={handleSave} disabled={saving || !!savedFlip} className="pill-primary w-full">
        {savedFlip ? 'Saved to your flips' : saving ? 'Saving...' : 'Save this flip'}
      </button>
    </div>
  );
}
