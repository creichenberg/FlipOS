'use client';

import { useEffect, useRef } from 'react';

// A soft light that follows the cursor across the parent's blueprint-grid
// background, like the section is lit from above and tracking where you're
// looking - replaces the grid's old constant diagonal drift on the landing
// and onboarding screens with something that responds to the visitor
// instead of animating on its own. Tracks mousemove on the parent element
// (not window) so multiple instances on one page - e.g. the landing page's
// hero and closing CTA - stay independent. Mutates the DOM directly via a
// ref rather than React state so cursor movement never triggers a re-render.
// Touch devices simply never fire mousemove, so they just get the grid with
// the shine parked at its CSS default position - same graceful degradation
// as this app's other hover-only effects. Skipped entirely under
// prefers-reduced-motion, same as this app's other ambient animations.
//
// `stacking` controls how it layers against its siblings, since that
// depends on what else is in the parent: 'below-content' (default) uses a
// negative z-index so it sits behind normal in-flow static content, e.g. the
// landing/onboarding screens where the grid pattern is the parent's own CSS
// background and the copy above it is plain static content. 'above-siblings'
// leaves z-index at auto so DOM order alone decides stacking, e.g. the login
// page, where the grid is a separate absolutely-positioned sibling <div> that
// a negative z-index would otherwise hide behind (its own opaque background
// would paint over a negative-z shine) - placing <MouseShine /> after that
// div in the DOM is enough for it to paint on top there.
export function MouseShine({ stacking = 'below-content' }: { stacking?: 'below-content' | 'above-siblings' }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame: number | null = null;
    let x = 50;
    let y = 15;

    function handleMove(e: MouseEvent) {
      const rect = parent!.getBoundingClientRect();
      x = ((e.clientX - rect.left) / rect.width) * 100;
      y = ((e.clientY - rect.top) / rect.height) * 100;
      if (frame === null) {
        frame = requestAnimationFrame(() => {
          el!.style.setProperty('--shine-x', `${x}%`);
          el!.style.setProperty('--shine-y', `${y}%`);
          frame = null;
        });
      }
    }

    parent.addEventListener('mousemove', handleMove);
    return () => {
      parent.removeEventListener('mousemove', handleMove);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`mouse-shine pointer-events-none absolute inset-0 ${stacking === 'below-content' ? '-z-10' : ''}`}
    />
  );
}
