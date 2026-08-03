'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Business } from '@/lib/types/database';
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
  };
}

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
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
      <div className="space-y-4">
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
        <div className="space-y-2">
          <Label htmlFor="personality">Brand personality (comma separated)</Label>
          <Input id="personality" value={form.brandPersonality} onChange={(e) => update('brandPersonality', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://" />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!valid || status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
