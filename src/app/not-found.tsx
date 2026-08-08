import Link from 'next/link';
import { ArrowRight, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="bg-blueprint-grid flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Clapperboard className="animate-in fade-in zoom-in-95 h-10 w-10 text-primary duration-700 fill-mode-both" />
      <p className="animate-in fade-in slide-in-from-bottom-2 font-display mt-6 text-7xl tracking-tight text-primary delay-100 duration-700 fill-mode-both sm:text-8xl">
        404
      </p>
      <h1 className="animate-in fade-in slide-in-from-bottom-2 mt-4 text-2xl font-semibold tracking-tight delay-200 duration-700 fill-mode-both">
        This scene didn&apos;t make the cut
      </h1>
      <p className="animate-in fade-in slide-in-from-bottom-2 mt-3 max-w-sm text-sm text-text-secondary delay-300 duration-700 fill-mode-both">
        The page you&apos;re looking for doesn&apos;t exist, moved, or was never filmed in the first place.
      </p>
      <div className="animate-in fade-in slide-in-from-bottom-2 mt-8 flex gap-3 delay-500 duration-700 fill-mode-both">
        <Button asChild>
          <Link href="/dashboard" className="group">
            Go to dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
