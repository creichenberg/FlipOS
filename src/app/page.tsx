import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Check, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { InteractiveLogo } from '@/components/design-system/InteractiveLogo';
import { Reveal } from '@/components/design-system/Reveal';
import { MouseShine } from '@/components/design-system/MouseShine';

const STEPS = [
  {
    title: 'Get your weekly plan',
    description: '5-10 video ideas a week (depending on your plan), built specifically for your business - no generic content calendar filler.',
  },
  {
    title: 'Open a card for the full package',
    description: 'Every idea expands into a hook, a full script, a shot-by-shot filming guide, and a caption ready to post.',
  },
  {
    title: 'Film it with Filming Mode',
    description: 'A guided, step-by-step flow walks you through each shot and voiceover line - zero video experience required.',
  },
  {
    title: 'We edit it for you',
    description: 'Upload your clips and we cut them together automatically, with captions burned in - no editing software, no learning curve.',
  },
];

const FEATURES = [
  {
    title: 'Built from your actual business',
    description: 'Every idea uses your real products, customers, and industry from onboarding - not a template that could apply to anyone else.',
  },
  {
    title: 'Scripts you can actually use',
    description: 'A full on-camera script and voiceover lines, split into short takes you record one at a time.',
  },
  {
    title: 'Beginner-friendly shot lists',
    description: 'Camera angle, shot type, and duration for every shot - specific enough to hand to someone who\'s never filmed before.',
  },
  {
    title: 'Caption and hashtags, done',
    description: 'Ready to paste and post the moment your edit is back - no extra copywriting step.',
  },
  {
    title: 'Auto-edited, captions burned in',
    description: 'Upload your filmed clips and we cut them together into one finished video, with captions burned in automatically - no editing skills needed.',
  },
];

const FEATURE_PREVIEW_SHOTS = [
  { number: 1, description: 'Wide shot of the shop floor, camera panning slowly left to right', angle: 'Wide', duration: '4s' },
  { number: 2, description: 'Close-up on hands demonstrating the repair', angle: 'Close-up', duration: '6s' },
];

const PLANS = [
  {
    name: 'Base',
    price: 15,
    videosPerWeek: 5,
    description: 'A steady stream of content without overcommitting.',
    features: [
      '5 video ideas every week',
      'Full script & shot list for each',
      'Guided Filming Mode',
      'Auto-edited video with captions',
      'Post caption & hashtags included',
    ],
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
      'Auto-edited video with captions',
      'Post caption & hashtags included',
      'Priority support',
    ],
    highlighted: true,
  },
];

const PREVIEW_CARDS = [
  {
    day: 'Monday',
    goal: 'Educate',
    title: '3 Things Every Homeowner Should Know Before Hiring a Plumber',
    concept: 'Quick, practical tips that build trust before they ever call.',
  },
  {
    day: 'Wednesday',
    goal: 'Sell',
    title: 'Why Riverside Plumbing Is Different',
    concept: "A direct case for why we're the right call in Austin.",
  },
  {
    day: 'Friday',
    goal: 'Engage',
    title: 'This or That: Help Us Decide',
    concept: 'A fast interactive prompt built to drive comments.',
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
          <div className="flex items-center gap-2">
            <InteractiveLogo className="h-6 w-6 rounded-md" />
            <span className="text-sm font-semibold tracking-tight">Blueprint Studio</span>
          </div>
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

      <section className="bg-blueprint-grid bg-blueprint-grid-interactive relative flex flex-col items-center px-6 pb-20 pt-24 text-center">
        <MouseShine />
        <p className="animate-in fade-in slide-in-from-bottom-2 font-mono text-xs font-medium uppercase tracking-[0.15em] text-primary duration-700">
          Blueprint Studio
        </p>
        <h1 className="animate-in fade-in slide-in-from-bottom-3 font-display mt-4 max-w-2xl text-4xl tracking-tight delay-100 duration-700 fill-mode-both sm:text-5xl">
          An AI social media manager for your business
        </h1>
        <p className="animate-in fade-in slide-in-from-bottom-3 mt-4 max-w-xl text-text-secondary delay-200 duration-700 fill-mode-both">
          Every week, get video ideas built for your business - each with a hook, a full script, and a shot-by-shot
          filming guide simple enough that anyone can film it. Upload your clips and we auto-edit them into a
          finished video with captions.
        </p>
        <div className="animate-in fade-in slide-in-from-bottom-3 mt-8 flex gap-3 delay-300 duration-700 fill-mode-both">
          <Button asChild size="lg">
            <Link href="/login">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#how-it-works">See how it works</Link>
          </Button>
        </div>

        <div className="animate-in fade-in zoom-in-95 mt-16 w-full max-w-3xl overflow-hidden rounded-2xl border border-border-subtle bg-surface text-left shadow-2xl delay-500 duration-700 fill-mode-both">
          <div className="flex items-center gap-1.5 border-b border-border-subtle px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
            <span className="ml-3 font-mono text-xs text-text-secondary">blueprintstudio.app/dashboard</span>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
            {PREVIEW_CARDS.map((card) => (
              <div key={card.day} className="rounded-lg border border-border-subtle bg-canvas p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">{card.day}</span>
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{card.goal}</span>
                </div>
                <p className="mt-2.5 text-sm font-medium leading-snug">{card.title}</p>
                <p className="mt-1.5 text-xs text-text-secondary">{card.concept}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border-subtle px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center font-mono text-xs uppercase tracking-[0.15em] text-primary">How it works</p>
          <h2 className="mt-2 text-center text-2xl font-semibold tracking-tight">From idea to posted video</h2>
          <div className="mt-12 grid grid-cols-1 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 100} className="p-6">
                <span className="font-mono text-3xl font-semibold text-primary/25">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-4 text-base font-medium">{step.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{step.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center font-mono text-xs uppercase tracking-[0.15em] text-primary">What&apos;s in every card</p>
          <h2 className="mt-2 text-center text-2xl font-semibold tracking-tight">Nothing left to figure out</h2>
          <div className="mt-12 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <div>
                {FEATURES.map((feature, i) => (
                  <div key={feature.title} className={`py-4 ${i === 0 ? 'border-t-0' : 'border-t border-border-subtle'}`}>
                    <h3 className="text-base font-medium">{feature.title}</h3>
                    <p className="mt-1.5 text-sm text-text-secondary">{feature.description}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface text-left shadow-2xl">
                <div className="flex items-center gap-1.5 border-b border-border-subtle px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
                  <span className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
                  <span className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
                  <span className="ml-3 font-mono text-xs text-text-secondary">blueprintstudio.app/cards/mon-01</span>
                </div>
                <div className="p-5">
                  <div className="rounded-xl border border-border-subtle bg-canvas p-5 border-l-2 border-l-primary">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wide text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      Hook · first 3 seconds
                    </div>
                    <p className="mt-2 text-sm leading-snug">
                      &ldquo;Most homeowners wait too long to call a plumber - here&apos;s how to tell.&rdquo;
                    </p>
                  </div>
                  <div className="mt-3 rounded-xl border border-border-subtle bg-canvas p-5">
                    <p className="font-mono text-xs font-medium uppercase tracking-wide text-text-secondary">Shot list</p>
                    <div className="mt-1">
                      {FEATURE_PREVIEW_SHOTS.map((shot) => (
                        <div key={shot.number} className="flex gap-3 border-b border-border-subtle py-3 last:border-b-0">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-medium text-primary">
                            {shot.number}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs">{shot.description}</p>
                            <p className="mt-1 text-[11px] text-text-secondary">{shot.angle} · {shot.duration}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-border-subtle px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-primary">Pricing</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Simple, predictable pricing</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">Pick the plan that matches how often you want to post. Cancel anytime.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 100}>
                <div
                  className={
                    plan.highlighted
                      ? 'hover-lift relative rounded-xl border border-primary/30 bg-surface p-6 shadow-[0_20px_45px_-25px_color-mix(in_oklch,var(--primary)_60%,transparent)]'
                      : 'hover-lift relative rounded-xl border border-border-subtle bg-surface p-6'
                  }
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
                  <p className="mt-1 font-mono text-xs text-text-secondary">{plan.videosPerWeek} video ideas every week</p>
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blueprint-grid bg-blueprint-grid-interactive relative border-t border-border-subtle px-6 py-20 text-center">
        <MouseShine />
        <h2 className="text-2xl font-semibold tracking-tight">Ready to plan this week&apos;s content?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">
          Set up your business profile in a few minutes and get your first weekly plan right away.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/login">Get started</Link>
        </Button>
      </section>

      <footer className="border-t border-border-subtle px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-xs text-text-secondary sm:flex-row">
          <span>&copy; {new Date().getFullYear()} Blueprint Studio</span>
          <span>Made for small businesses that don&apos;t have time to be video editors.</span>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
