'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { StepIndicator } from '@/components/design-system/StepIndicator';

const GOAL_OPTIONS = ['Build brand awareness', 'Drive sales', 'Build trust/credibility', 'Grow engagement', 'Educate customers'];

// Suggestions, not a restriction - the Industry field stays free text (via
// <datalist>) and Brand personality keeps a free-text "Other" field too.
// Prefilled/suggested options reduce the blank-page problem and nudge
// toward more specific, usable answers than typing from scratch.
const INDUSTRY_OPTIONS = [
  'Residential plumbing',
  'HVAC',
  'Electrical services',
  'Landscaping & lawn care',
  'House cleaning',
  'Auto repair',
  'Hair salon',
  'Barbershop',
  'Nail salon',
  'Med spa',
  'Personal training',
  'Yoga studio',
  'Restaurant',
  'Coffee shop',
  'Bakery',
  'Catering',
  'Photography',
  'Real estate',
  'Law firm',
  'Dental practice',
  'Veterinary clinic',
  'Pet grooming',
  'Interior design',
  'Bookkeeping & accounting',
];

const PERSONALITY_OPTIONS = [
  'Friendly',
  'Professional',
  'Bold',
  'Playful',
  'Trustworthy',
  'Innovative',
  'Down-to-earth',
  'Luxurious',
  'Quirky',
  'Reliable',
  'Warm',
  'Energetic',
];

const TOTAL_STEPS = 3;

interface FormState {
  name: string;
  industry: string;
  location: string;
  description: string;
  productsServices: string;
  targetAudience: string;
  brandPersonality: string[];
  brandPersonalityOther: string;
  goals: string[];
  website: string;
}

const initialState: FormState = {
  name: '',
  industry: '',
  location: '',
  description: '',
  productsServices: '',
  targetAudience: '',
  brandPersonality: [],
  brandPersonalityOther: '',
  goals: [],
  website: '',
};

// Minimum-detail gate: sparse onboarding answers ("we sell stuff") produce
// generic, unpersonalized content, undermining the entire product premise.
const MIN_LENGTH = 20;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleGoal(goal: string) {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(goal) ? f.goals.filter((g) => g !== goal) : [...f.goals, goal],
    }));
  }

  function togglePersonality(trait: string) {
    setForm((f) => ({
      ...f,
      brandPersonality: f.brandPersonality.includes(trait)
        ? f.brandPersonality.filter((t) => t !== trait)
        : [...f.brandPersonality, trait],
    }));
  }

  const step0Valid = form.name.trim().length > 0 && form.industry.trim().length > 0 && form.location.trim().length > 0;
  const step1Valid =
    form.description.trim().length >= MIN_LENGTH &&
    form.productsServices.trim().length >= MIN_LENGTH &&
    form.targetAudience.trim().length >= MIN_LENGTH;
  const step2Valid = form.goals.length > 0;

  // Surfaced under each field on step 1 so the Continue button's disabled
  // state is never a silent mystery - it previously required this same
  // minimum with no visible explanation anywhere.
  function remainingHint(value: string) {
    const remaining = MIN_LENGTH - value.trim().length;
    return remaining > 0 ? `Write a bit more - ${remaining} more character${remaining === 1 ? '' : 's'} needed` : null;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          industry: form.industry,
          location: form.location,
          description: form.description,
          productsServices: form.productsServices,
          targetAudience: form.targetAudience,
          brandPersonality: [
            ...form.brandPersonality,
            ...form.brandPersonalityOther
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          ],
          goals: form.goals,
          website: form.website,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Something went wrong');
      }
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 rounded-lg border border-border-subtle bg-surface p-8">
      <div>
        <p className="text-sm font-medium text-text-secondary">Tell us about your business</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">
          {step === 0 && 'The basics'}
          {step === 1 && 'What you do'}
          {step === 2 && 'Brand & goals'}
        </h2>
        <div className="mt-4">
          <StepIndicator current={step} total={TOTAL_STEPS} />
        </div>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business name</Label>
            <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Riverside Plumbing Co." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              list="industry-options"
              value={form.industry}
              onChange={(e) => update('industry', e.target.value)}
              placeholder="Residential plumbing"
            />
            <datalist id="industry-options">
              {INDUSTRY_OPTIONS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Austin, TX" />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">What do you do?</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="We're a family-owned plumbing company serving homeowners across the Austin metro..."
              rows={3}
            />
            {remainingHint(form.description) && <p className="text-xs text-text-secondary">{remainingHint(form.description)}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="products">Products/services</Label>
            <Textarea
              id="products"
              value={form.productsServices}
              onChange={(e) => update('productsServices', e.target.value)}
              placeholder="Drain cleaning, water heater installation, emergency leak repair..."
              rows={3}
            />
            {remainingHint(form.productsServices) && (
              <p className="text-xs text-text-secondary">{remainingHint(form.productsServices)}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience">Target audience</Label>
            <Textarea
              id="audience"
              value={form.targetAudience}
              onChange={(e) => update('targetAudience', e.target.value)}
              placeholder="Homeowners aged 30-60 who want a reliable, trustworthy plumber..."
              rows={3}
            />
            {remainingHint(form.targetAudience) && (
              <p className="text-xs text-text-secondary">{remainingHint(form.targetAudience)}</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Brand personality</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {PERSONALITY_OPTIONS.map((trait) => {
                const selected = form.brandPersonality.includes(trait);
                return (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => togglePersonality(trait)}
                    className={
                      selected
                        ? 'rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary'
                        : 'rounded-md border border-border-subtle px-3 py-1.5 text-sm text-text-secondary hover:border-primary/40 hover:text-foreground'
                    }
                  >
                    {trait}
                  </button>
                );
              })}
            </div>
            <Input
              id="personality-other"
              value={form.brandPersonalityOther}
              onChange={(e) => update('brandPersonalityOther', e.target.value)}
              placeholder="Other (comma separated)"
              className="mt-2"
            />
          </div>
          <div className="space-y-2">
            <Label>Goals for social media</Label>
            <div className="space-y-2.5 pt-1">
              {GOAL_OPTIONS.map((goal) => (
                <label key={goal} className="flex items-center gap-2.5 text-sm">
                  <Checkbox checked={form.goals.includes(goal)} onCheckedChange={() => toggleGoal(goal)} />
                  {goal}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website (optional)</Label>
            <Input id="website" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://" />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          Back
        </Button>
        {step < TOTAL_STEPS - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={(step === 0 && !step0Valid) || (step === 1 && !step1Valid)}
          >
            Continue
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!step2Valid || submitting}>
            {submitting ? 'Setting up…' : 'Finish setup'}
          </Button>
        )}
      </div>
    </div>
  );
}
