'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Business, CaptionStyle, EditStyle } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface FormState {
  ownerName: string;
  name: string;
  industry: string;
  location: string;
  description: string;
  productsServices: string;
  targetAudience: string;
  brandPersonality: string;
  website: string;
  captionStyle: CaptionStyle;
  editStyle: EditStyle;
}

function toFormState(business: Business): FormState {
  return {
    ownerName: business.owner_name,
    name: business.name,
    industry: business.industry,
    location: business.location,
    description: business.description,
    productsServices: business.products_services,
    targetAudience: business.target_audience,
    brandPersonality: business.brand_personality.join(', '),
    website: business.website ?? '',
    captionStyle: business.caption_style,
    editStyle: business.edit_style,
  };
}

// Client feedback: the default caption look "looks very AI" and "customization
// of the video would be nice." Scoped to what's already fully mechanical in
// creatomateProvider.ts (motion amount, caption font/stroke/background) - see
// CAPTION_STYLE_PRESETS/EDIT_STYLE_PRESETS there for the exact RenderScript
// values behind each option.
const CAPTION_STYLE_OPTIONS: { value: CaptionStyle; label: string; description: string }[] = [
  { value: 'outline-pop', label: 'Outline', description: 'Bold white text with a black outline, no background box' },
  { value: 'bold-pill', label: 'Bold pill', description: 'White text on a solid rounded background' },
  { value: 'minimal', label: 'Minimal', description: 'Smaller outlined text near the top of the frame' },
];

const EDIT_STYLE_OPTIONS: { value: EditStyle; label: string; description: string }[] = [
  { value: 'punchy', label: 'Punchy', description: 'Bigger zoom pushes and quicker cuts between shots' },
  { value: 'subtle', label: 'Subtle', description: 'Gentler motion and a softer crossfade between shots' },
];

export function EditBusinessForm({ business }: { business: Business }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toFormState(business));
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setStatus('idle');
  }

  const valid = form.ownerName.trim().length > 0 && form.name.trim().length > 0 && form.industry.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setError(null);
    try {
      const res = await fetch('/api/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: form.ownerName,
          name: form.name,
          industry: form.industry,
          location: form.location,
          description: form.description,
          productsServices: form.productsServices,
          targetAudience: form.targetAudience,
          brandPersonality: form.brandPersonality
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          goals: business.goals,
          website: form.website,
          captionStyle: form.captionStyle,
          editStyle: form.editStyle,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Something went wrong');
      }
      setStatus('saved');
      toast.success('Business details saved');
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setError(message);
      toast.error(message);
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border-subtle bg-surface p-6">
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-text-secondary">About you &amp; your business</h2>
        <div className="mt-3 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="owner-name">Your name</Label>
            <Input id="owner-name" value={form.ownerName} onChange={(e) => update('ownerName', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Business name</Label>
            <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" value={form.industry} onChange={(e) => update('industry', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => update('location', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://" />
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-text-secondary">Your offering</h2>
        <div className="mt-3 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">What you do</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="products">Products/services</Label>
            <Textarea id="products" rows={3} value={form.productsServices} onChange={(e) => update('productsServices', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience">Target audience</Label>
            <Textarea id="audience" rows={3} value={form.targetAudience} onChange={(e) => update('targetAudience', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-text-secondary">Brand</h2>
        <div className="mt-3 space-y-2">
          <Label htmlFor="personality">Brand personality (comma separated)</Label>
          <Input id="personality" value={form.brandPersonality} onChange={(e) => update('brandPersonality', e.target.value)} />
        </div>
      </div>

      <div className="border-t border-border-subtle pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-text-secondary">Video style</h2>
        <div className="mt-3 space-y-4">
          <div className="space-y-2">
            <Label>Caption style</Label>
            <div className="flex flex-wrap gap-2">
              {CAPTION_STYLE_OPTIONS.map((option) => {
                const selected = form.captionStyle === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update('captionStyle', option.value)}
                    title={option.description}
                    className={
                      selected
                        ? 'rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary'
                        : 'rounded-md border border-border-subtle px-3 py-1.5 text-sm text-text-secondary hover:border-primary/40 hover:text-foreground'
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-text-secondary">
              {CAPTION_STYLE_OPTIONS.find((o) => o.value === form.captionStyle)?.description}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Edit pacing</Label>
            <div className="flex flex-wrap gap-2">
              {EDIT_STYLE_OPTIONS.map((option) => {
                const selected = form.editStyle === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update('editStyle', option.value)}
                    title={option.description}
                    className={
                      selected
                        ? 'rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary'
                        : 'rounded-md border border-border-subtle px-3 py-1.5 text-sm text-text-secondary hover:border-primary/40 hover:text-foreground'
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-text-secondary">{EDIT_STYLE_OPTIONS.find((o) => o.value === form.editStyle)?.description}</p>
          </div>
          <p className="text-xs text-text-secondary">Applies to your next auto-edited video, not ones you&apos;ve already rendered.</p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3 border-t border-border-subtle pt-6">
        <Button type="submit" disabled={!valid || status === 'saving'} className="disabled:opacity-70">
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
