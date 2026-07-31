import Link from 'next/link';

export default function Nav() {
  return (
    <header className="sticky top-0 z-10 bg-canvas/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="font-display text-lg font-extrabold tracking-tight text-ink">
          Flip<span className="text-graphite">OS</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="hidden rounded-full px-3 py-1.5 font-medium text-graphite transition-colors hover:text-ink sm:inline"
          >
            Best Flips
          </Link>
          <Link
            href="/search"
            className="hidden rounded-full px-3 py-1.5 font-medium text-graphite transition-colors hover:text-ink sm:inline"
          >
            Find Deals
          </Link>
          <Link
            href="/saved"
            className="hidden rounded-full px-3 py-1.5 font-medium text-graphite transition-colors hover:text-ink sm:inline"
          >
            Saved
          </Link>
          <Link href="/upload" className="pill-primary ml-2 hidden px-4 py-2 text-sm sm:inline-block">
            + New Flip
          </Link>
        </nav>
      </div>
    </header>
  );
}
