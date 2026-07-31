import Link from 'next/link';

export default function Nav() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-lg font-bold tracking-tight">
          Flip<span className="text-caution">OS</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-graphite">
          <Link href="/" className="hover:text-paper">
            Best Flips
          </Link>
          <Link href="/search" className="hover:text-paper">
            Find Deals
          </Link>
          <Link href="/saved" className="hover:text-paper">
            Saved
          </Link>
          <Link
            href="/upload"
            className="rounded-card bg-paper px-3 py-1.5 font-medium text-ink hover:bg-paper-dim"
          >
            + New Flip
          </Link>
        </nav>
      </div>
    </header>
  );
}
