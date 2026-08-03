'use client';

import { useEffect, useRef } from 'react';

// A small vertical drift as the element scrolls through the viewport - moves
// at a fraction of scroll speed via a directly-mutated transform (not React
// state, so scrolling never triggers a re-render - same rAF-throttled,
// ref-driven pattern as MouseShine). Kept deliberately subtle: the offset is
// clamped to a small pixel range regardless of how far the element sits from
// the viewport, so a long scroll never sends it drifting far from its
// natural position. Driven by `scroll`/`resize` rather than an
// IntersectionObserver since the offset needs to keep updating continuously
// while the element is on screen, not just once on entry (that's what
// Reveal.tsx is for). Skipped entirely under prefers-reduced-motion, same as
// this app's other ambient animations.
export function Parallax({
  children,
  speed = 0.12,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame: number | null = null;

    function update() {
      frame = null;
      const rect = el!.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const offset = Math.max(-28, Math.min(28, (viewportCenter - elementCenter) * speed));
      el!.style.transform = `translateY(${offset.toFixed(1)}px)`;
    }

    function onScroll() {
      if (frame === null) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
