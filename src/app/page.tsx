import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, Clapperboard, Camera, Sparkles, ScrollText, Hash, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    icon: Calendar,
    title: '1. Get your weekly plan',
    description: '7 video ideas built specifically for your business - one for each day of the week, no generic content calendar filler.',
  },
  {
    icon: Clapperboard,
    title: '2. Open a card for the full package',
    description: 'Every idea expands into a hook, a full script, a shot-by-shot filming guide, and a caption ready to post.',
  },
  {
    icon: Camera,
    title: '3. Film it with Filming Mode',
    description: 'A guided, step-by-step flow walks you through each shot and voiceover line - zero video experience required.',
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Personalized, not generic',
    description: 'Every idea is grounded in your actual products, customers, and industry - not a template that could apply to anyone.',
  },
  {
    icon: ScrollText,
    title: 'Scripts you can actually use',
    description: 'Full on-camera scripts and voiceover lines, broken into short takes that are easy to record one at a time.',
  },
  {
    icon: Camera,
    title: 'Beginner-friendly shot lists',
    description: 'Camera angle, shot type, and duration for every shot - specific enough that anyone can film it correctly.',
  },
  {
    icon: Hash,
    title: 'Captions & hashtags included',
    description: 'Ready-to-post captions and hashtags generated alongside every video, no extra copywriting needed.',
  },
];

const PLANS = [
  {
    name: 'Base',
    price: 15,
    videosPerWeek: 5,
    description: 'A steady stream of content without overcommitting.',
    features: ['5 video ideas every week', 'Full script & shot list for each', 'Guided Filming Mode', 'Captions & hashtags included'],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 20,
    videosPerWeek: 10,
    description: 'For businesses that want to post more often.',
    features: [
      '10 video ideas every week',
      'Full script & shot list for each',
      'Guided Filming Mode',
      'Captions & hashtags included',
      'Priority support',
    ],
    highlighted: true,
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border-subtle">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight">Blueprint Studio</span>
          <div className="flex items-center gap-4">
            <Link href="#pricing" className="hidden text-sm text-text-secondary hover:text-foreground sm:inline">
              Pricing
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="bg-blueprint-grid flex flex-col items-center px-6 py-24 text-center">
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
          <Button asChild variant="outline" size="lg">
            <Link href="#how-it-works">See how it works</Link>
          </Button>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border-subtle px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">From idea to posted video</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.title} className="text-center sm:text-left">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-surface sm:mx-0">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-medium">{step.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Everything you need to post consistently</h2>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-border-subtle bg-surface p-6">
                <feature.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-base font-medium">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-border-subtle px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Simple, predictable pricing</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">Pick the plan that matches how often you want to post. Cancel anytime.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-lg border p-6 ${
                  plan.highlighted ? 'border-primary bg-surface' : 'border-border-subtle bg-surface'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-6 rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="text-base font-medium">{plan.name}</h3>
                <p className="mt-1 text-sm text-text-secondary">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">${plan.price}</span>
                  <span className="text-sm text-text-secondary">/ month</span>
                </div>
                <p className="mt-1 text-xs text-text-secondary">{plan.videosPerWeek} video ideas every week</p>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full" variant={plan.highlighted ? 'default' : 'outline'}>
                  <Link href="/login">Get started</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Ready to plan this week&apos;s content?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">
          Set up your business profile in a few minutes and get your first weekly plan right away.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/login">Get started</Link>
        </Button>
      </section>

      <footer className="border-t border-border-subtle px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-xs text-text-secondary">
          <span>&copy; {new Date().getFullYear()} Blueprint Studio</span>
          <span>Made for small businesses that don&apos;t have time to be video editors.</span>
        </div>
      </footer>
    </div>
  );
}
