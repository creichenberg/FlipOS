import Link from 'next/link';

export default function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/[0.08] bg-black/70 backdrop-blur-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-lg font-bold tracking-tight">
          Flip<span className="text-accent">OS</span>
        </Link>
        <nav className="flex items-center gap-3 text-xs text-graphite sm:gap-6 sm:text-sm">
          <Link href="/" className="transition-colors hover:text-paper">
            Best Flips
          </Link>
          <Link href="/search" className="transition-colors hover:text-paper">
            Find Deals
          </Link>
          <Link href="/saved" className="transition-colors hover:text-paper">
            Saved
          </Link>
          <Link
            href="/upload"
            className="rounded-full bg-paper px-3 py-1.5 font-semibold text-ink transition-opacity hover:opacity-90 sm:px-4"
          >
            + New Flip
          </Link>
        </nav>
      </div>
    </header>
  );
}
