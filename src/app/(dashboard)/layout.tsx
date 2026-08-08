import Link from 'next/link';
import { DashboardNav } from '@/components/features/dashboard/DashboardNav';
import { Logo } from '@/components/design-system/Logo';
import { RenderNotifications } from '@/components/features/dashboard/RenderNotifications';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = isAdminEmail(user?.email);

  return (
    <div className="min-h-screen bg-canvas">
      <RenderNotifications />
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-canvas">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Logo className="h-6 w-6 rounded-md" />
            Blueprint Studio
          </Link>
          <DashboardNav isAdmin={isAdmin} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
