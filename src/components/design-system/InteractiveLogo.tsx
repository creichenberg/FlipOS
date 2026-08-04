'use client';

import { useEffect, useRef } from 'react';
import { Logo } from './Logo';

// Same idea as MouseShine, scaled down and clipped to the logo's own
// rounded-square shape - a small glossy highlight that sweeps across the
// mark as the cursor moves, like it's catching the light. Tracks the whole
// window rather than a local parent: there's only ever one logo per page,
// so there's no risk of multiple instances fighting over one cursor
// position the way MouseShine's independent background sections needed.
// className is applied to the clipping wrapper (not the inner <Logo>) so
// sizing/rounding/shadow classes from call sites still land correctly.
export function InteractiveLogo({ className = 'h-8 w-8' }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame: number | null = null;

    function handleMove(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      if (frame === null) {
        frame = requestAnimationFrame(() => {
          el!.style.setProperty('--shine-x', `${x}%`);
          el!.style.setProperty('--shine-y', `${y}%`);
          frame = null;
        });
      }
    }

    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <span className={`relative inline-block overflow-hidden ${className}`}>
      <Logo className="h-full w-full" />
      <span aria-hidden="true" ref={ref} className="logo-shine pointer-events-none absolute inset-0" />
    </span>
  );
}
