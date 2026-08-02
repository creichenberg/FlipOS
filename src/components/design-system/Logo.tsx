// Mirrors src/app/icon.svg (the site favicon) so every "Blueprint Studio"
// wordmark in the app uses the exact same mark, not a text-letter stand-in.
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Blueprint Studio">
      <rect width="32" height="32" rx="7" fill="oklch(0.6 0.152 40)" />
      <g stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1">
        <line x1="11" y1="4" x2="11" y2="28" />
        <line x1="21" y1="4" x2="21" y2="28" />
        <line x1="4" y1="11" x2="28" y2="11" />
        <line x1="4" y1="21" x2="28" y2="21" />
      </g>
      <path d="M13 10.5 L22 16 L13 21.5 Z" fill="#ffffff" />
    </svg>
  );
}
