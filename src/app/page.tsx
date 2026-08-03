import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, Clapperboard, Camera, Sparkles, ScrollText, Hash, Check, Wand2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { InteractiveLogo } from '@/components/design-system/InteractiveLogo';
import { Reveal } from '@/components/design-system/Reveal';
import { MouseShine } from '@/components/design-system/MouseShine';

const STEPS = [
  {
    icon: Calendar,
    title: 'Get your weekly plan',
    description: '5-10 video ideas a week (depending on your plan), built specifically for your business - no generic content calendar filler.',
  },
  {
    icon: Clapperboard,
    title: 'Open a card for the full package',
    description: 'Every idea expands into a hook, a full script, a shot-by-shot filming guide, and a caption ready to post.',
  },
  {
    icon: Camera,
    title: 'Film it with Filming Mode',
    description: 'A guided, step-by-step flow walks you through each shot and voiceover line - zero video experience required.',
  },
  {
    icon: Wand2,
    title: 'We edit it for you',
    description: 'Upload your clips and we cut them together automatically, with captions burned in - no editing software, no learning curve.',
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
    title: 'Post caption & hashtags written for you',
    description: 'A ready-to-post caption and hashtags generated alongside every video, no extra copywriting needed.',
  },
  {
    icon: Wand2,
    title: 'Auto-edited, captions burned in',
    description: 'Upload your filmed clips and we cut them together into one finished video, with captions burned in automatically - no editing skills needed.',
  },
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
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 100} className="text-center sm:text-left">
                <div className="mx-auto flex items-center gap-3 sm:mx-0">
                  <span className="font-mono text-3xl font-semibold text-primary/25">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <h3 className="mt-4 text-base font-medium">{step.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{step.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center font-mono text-xs uppercase tracking-[0.15em] text-primary">Features</p>
          <h2 className="mt-2 text-center text-2xl font-semibold tracking-tight">Everything you need to post consistently</h2>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 80}>
                <div className="hover-lift rounded-xl border border-border-subtle bg-surface p-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="mt-4 text-base font-medium">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-text-secondary">{feature.description}</p>
                </div>
              </Reveal>
            ))}
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
        <div className="mx-auto flex max-w-5xl items-center justify-between text-xs text-text-secondary">
          <span>&copy; {new Date().getFullYear()} Blueprint Studio</span>
          <span>Made for small businesses that don&apos;t have time to be video editors.</span>
        </div>
      </footer>
    </div>
  );
}
