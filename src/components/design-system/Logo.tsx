// Mirrors src/app/icon.svg (the site favicon) so every "Blueprint Studio"
// wordmark in the app uses the exact same mark, not a text-letter stand-in.
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Blueprint Studio">
      <rect width="32" height="32" rx="7" fill="oklch(0.6 0.152 255)" />
      <path
        d="M8 8.5a2.5 2.5 0 0 1 2.5-2.5h11a2.5 2.5 0 0 1 2.5 2.5v8.5a2.5 2.5 0 0 1-2.5 2.5h-7.6l-3.9 3.1v-3.1h-.5A2.5 2.5 0 0 1 8 17z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="10.6" y="14.5" width="2.1" height="3.3" rx="0.5" fill="#ffffff" />
      <rect x="14" y="12.2" width="2.1" height="5.6" rx="0.5" fill="#ffffff" />
      <rect x="17.4" y="9.6" width="2.1" height="8.2" rx="0.5" fill="#ffffff" />
      <path d="M10.3 16c2.8-.9 5.8-2.4 8.6-5.8" stroke="#ffffff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path
        d="M16.6 8.9l2.6.5-.2 2.6"
        stroke="#ffffff"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
