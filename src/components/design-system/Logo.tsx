// Mirrors src/app/icon.svg (the site favicon) so every "Blueprint Studio"
// wordmark in the app uses the exact same mark, not a text-letter stand-in.
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Blueprint Studio">
      <path
        d="M12 6.5 L22.5 6.5 A4 4 0 0 1 26.5 10.5 L26.5 19 A4 4 0 0 1 22.5 23
           L12.5 23 L8.7 28.7 L9.2 19.5 L9.2 10.5 A4 4 0 0 1 12 6.5 Z"
        fill="none"
        stroke="oklch(0.6 0.152 255)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="10.1" y="16.8" width="2.6" height="5.5" rx="0.5" fill="oklch(0.6 0.152 255)" />
      <rect x="14.7" y="12.6" width="2.6" height="9.7" rx="0.5" fill="oklch(0.6 0.152 255)" />
      <rect x="19.3" y="8.8" width="2.6" height="13.5" rx="0.5" fill="oklch(0.6 0.152 255)" />
      <path d="M9.3 20.6c4.7-.9 9.9-3.1 13.9-8.6" stroke="oklch(0.6 0.152 255)" strokeWidth="1.9" fill="none" strokeLinecap="round" />
      <path
        d="M20 10.2l4.6-.7 1 4.4"
        stroke="oklch(0.6 0.152 255)"
        strokeWidth="1.9"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
