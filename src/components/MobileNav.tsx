'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  {
    href: '/',
    label: 'Best Flips',
    icon: (
      <path d="M4 11.5 12 5l8 6.5M6 10v9a1 1 0 0 0 1 1h4v-5h2v5h4a1 1 0 0 0 1-1v-9" />
    ),
  },
  {
    href: '/search',
    label: 'Find Deals',
    icon: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.3-4.3" /></>,
  },
  {
    href: '/saved',
    label: 'Saved',
    icon: <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />,
  },
  {
    href: '/upload',
    label: 'New Flip',
    icon: <path d="M12 5v14M5 12h14" />,
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-4 z-20 flex justify-center sm:hidden">
      <div className="flex items-center gap-1 rounded-full bg-ink p-1.5 shadow-soft">
        {ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                active ? 'bg-white text-ink' : 'text-white/70'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                {item.icon}
              </svg>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
