'use client';

import { useEffect, useState } from 'react';

// Roughly tracks what the request is actually doing (read listing -> identify
// product -> price it -> score it). We can't stream real progress out of a
// single Claude call, so these advance on a timer - the point is to make a
// ~10s wait legible rather than to claim precise progress.
const STEPS = ['Reading the listing', 'Identifying the product', 'Checking recent sold prices', 'Scoring the flip'];
const STEP_MS = 2600;

export default function AnalyzingOverlay() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/90 px-4 backdrop-blur-md">
      <div className="surface w-full max-w-sm p-8">
        <div className="flex justify-center">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-ink" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-ink" />
          </span>
        </div>

        <h2 className="mt-6 text-center text-xl font-bold tracking-tight">Analyzing your listing</h2>
        <p className="mt-1.5 text-center text-sm text-graphite">This usually takes about 10 seconds.</p>

        <ul className="mt-7 space-y-3">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li
                key={label}
                className={`flex items-center gap-3 text-[15px] transition-opacity duration-300 ${
                  done || active ? 'opacity-100' : 'opacity-35'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                    done ? 'bg-profit text-white' : active ? 'bg-ink text-white' : 'bg-ink/[0.08] text-graphite'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span className={done || active ? 'font-medium text-ink' : 'text-graphite'}>{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
