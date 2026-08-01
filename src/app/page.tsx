import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-text-secondary">Blueprint Studio</p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        An AI social media manager for your business
      </h1>
      <p className="mt-4 max-w-xl text-text-secondary">
        Every week, get 7 video ideas built for your business - each with a hook, a full script, and a shot-by-shot
        filming guide simple enough that anyone can film it.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild size="lg">
          <Link href="/login">Get started</Link>
        </Button>
      </div>
    </div>
  );
}
