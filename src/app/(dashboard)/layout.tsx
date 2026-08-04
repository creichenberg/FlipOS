import Link from 'next/link';
import { DashboardNav } from '@/components/features/dashboard/DashboardNav';
import { Logo } from '@/components/design-system/Logo';
import { RenderNotifications } from '@/components/features/dashboard/RenderNotifications';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <RenderNotifications />
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-canvas">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Logo className="h-6 w-6 rounded-md" />
            Blueprint Studio
          </Link>
          <DashboardNav />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
