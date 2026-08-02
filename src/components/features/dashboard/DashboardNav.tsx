'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/design-system/ThemeToggle';
import { SignOutButton } from '@/components/features/dashboard/SignOutButton';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/billing', label: 'Billing' },
  { href: '/settings', label: 'Settings' },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {LINKS.map((link) => {
        const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? 'rounded-md bg-primary/10 px-3 py-1.5 font-medium text-primary'
                : 'rounded-md px-3 py-1.5 text-text-secondary hover:bg-surface hover:text-foreground'
            }
          >
            {link.label}
          </Link>
        );
      })}
      <div className="ml-1 flex items-center gap-1 border-l border-border-subtle pl-2">
        <ThemeToggle />
        <SignOutButton />
      </div>
    </nav>
  );
}
