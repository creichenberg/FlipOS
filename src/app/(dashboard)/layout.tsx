import Link from 'next/link';
import { SignOutButton } from '@/components/features/dashboard/SignOutButton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border-subtle">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            Blueprint Studio
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/dashboard" className="rounded-md px-3 py-1.5 text-text-secondary hover:bg-surface hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/billing" className="rounded-md px-3 py-1.5 text-text-secondary hover:bg-surface hover:text-foreground">
              Billing
            </Link>
            <Link href="/settings" className="rounded-md px-3 py-1.5 text-text-secondary hover:bg-surface hover:text-foreground">
              Settings
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
