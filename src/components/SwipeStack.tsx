'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import ExploreCard from './ExploreCard';
import type { DealCardData } from './DealCard';

const SWIPE_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 500;
const FLY_DISTANCE = 600;

function SwipeableTopCard({
  deal,
  exitDirection,
  onExitComplete,
}: {
  deal: DealCardData;
  exitDirection: 'left' | 'right' | null;
  onExitComplete: (dir: 'left' | 'right') => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-16, 16]);
  const saveOpacity = useTransform(x, [20, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -20], [1, 0]);

  useEffect(() => {
    if (!exitDirection) return;
    const target = exitDirection === 'right' ? FLY_DISTANCE : -FLY_DISTANCE;
    const controls = animate(x, target, { duration: 0.35, ease: 'easeIn' });
    controls.then(() => onExitComplete(exitDirection));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitDirection]);

  function handleDragEnd(_event: unknown, info: PanInfo) {
    if (exitDirection) return;
    const passed = Math.abs(info.offset.x) > SWIPE_THRESHOLD || Math.abs(info.velocity.x) > VELOCITY_THRESHOLD;
    if (passed) {
      const dir: 'left' | 'right' = info.offset.x > 0 ? 'right' : 'left';
      const target = dir === 'right' ? FLY_DISTANCE : -FLY_DISTANCE;
      animate(x, target, { duration: 0.25, ease: 'easeOut' }).then(() => onExitComplete(dir));
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  }

  return (
    <motion.div
      className="absolute inset-0 touch-none"
      style={{ x, rotate, cursor: exitDirection ? 'default' : 'grab' }}
      drag={exitDirection ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className="pointer-events-none absolute left-5 top-5 z-10 -rotate-12">
        <motion.span
          style={{ opacity: passOpacity }}
          className="rounded-control border-[3px] border-risk px-3 py-1 text-lg font-extrabold uppercase tracking-wider text-risk"
        >
          Pass
        </motion.span>
      </div>
      <div className="pointer-events-none absolute right-5 top-5 z-10 rotate-12">
        <motion.span
          style={{ opacity: saveOpacity }}
          className="rounded-control border-[3px] border-profit px-3 py-1 text-lg font-extrabold uppercase tracking-wider text-profit"
        >
          Save
        </motion.span>
      </div>
      <ExploreCard deal={deal} />
    </motion.div>
  );
}

export default function SwipeStack({ initialDeals }: { initialDeals: DealCardData[] }) {
  const router = useRouter();
  const [deals, setDeals] = useState(initialDeals);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  function triggerSwipe(dir: 'left' | 'right') {
    if (exitDirection || deals.length === 0) return;
    setExitDirection(dir);
  }

  function handleExitComplete(dir: 'left' | 'right') {
    const top = deals[0];
    if (dir === 'right' && top) {
      setSavedCount((c) => c + 1);
      fetch('/api/flips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: top.analysisId }),
      }).catch(() => {});
    }
    setDeals((prev) => prev.slice(1));
    setExitDirection(null);
  }

  const visible = deals.slice(0, 3);
  const top = visible[0];

  if (!top) {
    return (
      <div className="surface mx-auto flex max-w-sm flex-col items-center gap-3 p-10 text-center">
        <p className="font-display text-lg font-bold">That&apos;s everything for now</p>
        <p className="text-sm text-graphite">
          {savedCount > 0 ? `You saved ${savedCount} flip${savedCount === 1 ? '' : 's'}.` : 'Nothing saved this round.'}
        </p>
        <button
          onClick={() => {
            setDeals(initialDeals);
            setSavedCount(0);
          }}
          className="pill-primary mt-2 px-6 text-sm"
        >
          Start over
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mx-auto h-[480px] w-full max-w-sm sm:h-[520px]">
        {visible
          .slice()
          .reverse()
          .map((deal) => {
            const i = visible.indexOf(deal);
            if (i === 0) {
              return (
                <SwipeableTopCard
                  key={deal.analysisId}
                  deal={deal}
                  exitDirection={exitDirection}
                  onExitComplete={handleExitComplete}
                />
              );
            }
            return (
              <div
                key={deal.analysisId}
                className="absolute inset-0 transition-transform duration-300"
                style={{ transform: `scale(${1 - i * 0.04}) translateY(${i * 10}px)`, opacity: 1 - i * 0.3 }}
              >
                <ExploreCard deal={deal} />
              </div>
            );
          })}
      </div>

      <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-4">
        <button onClick={() => triggerSwipe('left')} aria-label="Pass" className="icon-btn h-14 w-14 text-2xl text-risk">
          ✕
        </button>
        <button onClick={() => router.push(`/analysis/${top.analysisId}`)} className="pill-secondary px-5 text-sm">
          Details
        </button>
        <button onClick={() => triggerSwipe('right')} aria-label="Save" className="icon-btn h-14 w-14 text-2xl text-profit">
          ♥
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-graphite">{deals.length} left · swipe or use the buttons</p>
    </div>
  );
}
