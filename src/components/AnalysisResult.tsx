'use client';

import { useState } from 'react';
import type { FlipAnalysis, Listing, SavedFlip } from '@prisma/client';
import FlipScoreBadge from './FlipScoreBadge';

type AnalysisWithRelations = FlipAnalysis & { listing: Listing; savedFlip: SavedFlip | null };

const DECISION_STYLE: Record<string, string> = {
  BUY: 'bg-profit text-white',
  NEGOTIATE: 'bg-ink text-white',
  PASS: 'bg-risk text-white',
};

const DECISION_BLURB: Record<string, string> = {
  BUY: 'Worth buying at asking price',
  NEGOTIATE: 'Worth buying — but make an offer first',
  PASS: 'Not worth the risk',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface p-6">
      <h2 className="eyebrow">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-graphite" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function AnalysisResult({ analysis }: { analysis: AnalysisWithRelations }) {
  const [savedFlip, setSavedFlip] = useState(analysis.savedFlip);
  const [saving, setSaving] = useState(false);

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

  const imageUrl = analysis.listing.imageUrls[0];
  const profit = Math.round(analysis.estimatedProfit);
  const profitPositive = profit >= 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Hero: the verdict and the money, before any of the supporting detail. */}
      <div className="surface overflow-hidden">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="aspect-[16/9] w-full bg-canvas object-cover" />
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[13px] text-graphite">
                {analysis.category}
                {analysis.listing.marketplace ? ` · ${analysis.listing.marketplace}` : ''}
              </p>
              <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                {analysis.identifiedProduct}
              </h1>
              {analysis.conditionAssessed && (
                <p className="mt-2 text-sm text-ink-soft">{analysis.conditionAssessed}</p>
              )}
            </div>
            <FlipScoreBadge score={analysis.flipScore} category={analysis.flipCategory} size="lg" />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-4 py-2 text-sm font-bold tracking-wide ${DECISION_STYLE[analysis.buyDecision]}`}
            >
              {analysis.buyDecision}
            </span>
            <span className="text-sm text-ink-soft">{DECISION_BLURB[analysis.buyDecision]}</span>
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{analysis.flipReasoning}</p>

          {/* The save action lives with the verdict rather than in a floating
              bar - this is where the decision actually gets made, and it
              avoids a sticky element obscuring the content below. */}
          <button
            onClick={handleSave}
            disabled={saving || !!savedFlip}
            className={`mt-5 w-full ${savedFlip ? 'pill-secondary' : 'pill-primary'}`}
          >
            {savedFlip ? '✓ Saved to your flips' : saving ? 'Saving…' : 'Save this flip'}
          </button>
        </div>

        {/* Money block - tinted by outcome so the verdict is legible at a glance. */}
        <div className={`grid grid-cols-3 divide-x divide-line border-t border-line ${profitPositive ? 'bg-profit-wash' : 'bg-risk-wash'}`}>
          <div className="p-5">
            <p className="eyebrow">Est. profit</p>
            <p className={`mt-1.5 text-figure tabular-nums ${profitPositive ? 'text-profit' : 'text-risk'}`}>
              {profitPositive ? '+' : '−'}${Math.abs(profit).toLocaleString()}
            </p>
          </div>
          <div className="p-5">
            <p className="eyebrow">ROI</p>
            <p className="mt-1.5 text-figure tabular-nums">{analysis.roi.toFixed(0)}%</p>
          </div>
          <div className="p-5">
            <p className="eyebrow">Buy → Resale</p>
            <p className="mt-2.5 text-sm font-semibold tabular-nums leading-snug">
              ${analysis.listing.askingPrice.toLocaleString()}
              <span className="text-graphite"> → </span>
              ${analysis.estimatedResaleValueLow.toLocaleString()}–{analysis.estimatedResaleValueHigh.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line px-6 py-4 text-xs text-graphite">
          <span>
            Confidence <span className="font-semibold text-ink">{analysis.confidence}</span>
          </span>
          <span>
            Demand <span className="font-semibold text-ink">{analysis.demand}</span>
          </span>
          <span>
            Competition <span className="font-semibold text-ink">{analysis.competition}</span>
          </span>
        </div>
      </div>

      {(analysis.riskFactors.length > 0 || analysis.thingsToCheck.length > 0 || analysis.whyUnderpriced) && (
        <Section title="Before you buy">
          {analysis.riskFactors.length > 0 && <Bullets items={analysis.riskFactors} />}
          {analysis.thingsToCheck.length > 0 && (
            <>
              <p className="eyebrow mt-5">Verify in person</p>
              <div className="mt-3">
                <Bullets items={analysis.thingsToCheck} />
              </div>
            </>
          )}
          {analysis.whyUnderpriced && (
            <div className="mt-5 rounded-control bg-canvas p-4">
              <p className="eyebrow">Why it&apos;s priced this way</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{analysis.whyUnderpriced}</p>
            </div>
          )}
        </Section>
      )}

      {(analysis.recommendedOfferPrice != null || analysis.negotiationMessage) && (
        <Section title="How to buy it">
          {analysis.recommendedOfferPrice != null && (
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-graphite">Open at</span>
              <span className="text-3xl font-extrabold tracking-tight tabular-nums">
                ${analysis.recommendedOfferPrice.toLocaleString()}
              </span>
            </div>
          )}
          {analysis.negotiationMessage && (
            <div className="mt-4 rounded-control bg-canvas p-4">
              <p className="eyebrow">Message to send</p>
              <p className="mt-2 text-[15px] leading-relaxed">&ldquo;{analysis.negotiationMessage}&rdquo;</p>
            </div>
          )}
        </Section>
      )}

      <Section title="How to sell it">
        <div className="flex flex-wrap gap-x-12 gap-y-4">
          <div>
            <p className="eyebrow">List on</p>
            <p className="mt-1 text-lg font-bold">{analysis.bestPlatform}</p>
          </div>
          <div>
            <p className="eyebrow">List at</p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              ${analysis.recommendedSellPrice?.toLocaleString()}
            </p>
          </div>
        </div>

        {analysis.listingTitle && (
          <div className="mt-5">
            <p className="eyebrow">Suggested title</p>
            <p className="mt-1.5 text-[15px] font-medium leading-snug">{analysis.listingTitle}</p>
          </div>
        )}
        {analysis.listingDescription && (
          <div className="mt-4">
            <p className="eyebrow">Suggested description</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{analysis.listingDescription}</p>
          </div>
        )}
        {analysis.keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {analysis.keywords.map((k) => (
              <span key={k} className="rounded-full bg-canvas px-3 py-1.5 text-xs font-medium">
                {k}
              </span>
            ))}
          </div>
        )}
        {analysis.photosNeeded.length > 0 && (
          <div className="mt-5">
            <p className="eyebrow">Photos to take</p>
            <div className="mt-3">
              <Bullets items={analysis.photosNeeded} />
            </div>
          </div>
        )}
      </Section>

    </div>
  );
}
