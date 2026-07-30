'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MARKETPLACES = ['eBay', 'Facebook Marketplace', 'Craigslist', 'OfferUp', 'Mercari', 'Poshmark', 'Other'];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export default function UploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [marketplace, setMarketplace] = useState(MARKETPLACES[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    try {
      const images = await Promise.all(
        files.slice(0, 6).map(async (f) => ({
          mediaType: f.type as 'image/jpeg' | 'image/png' | 'image/webp',
          base64: await fileToBase64(f),
        }))
      );

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          askingPrice: parseFloat(askingPrice),
          marketplace,
          images,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Analysis failed. Try again.');
      }

      const { analysisId } = await res.json();
      router.push(`/analysis/${analysisId}`);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-graphite">Listing title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Sony A7 III Camera Body"
          className="mt-1 w-full rounded-card border border-white/15 bg-ink-soft px-3 py-2 text-paper placeholder:text-graphite"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-graphite">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Anything the seller wrote about condition, accessories, flaws..."
          className="mt-1 w-full rounded-card border border-white/15 bg-ink-soft px-3 py-2 text-paper placeholder:text-graphite"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-graphite">Asking price</label>
          <div className="mt-1 flex items-center rounded-card border border-white/15 bg-ink-soft px-3">
            <span className="text-graphite">$</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              className="w-full bg-transparent py-2 pl-1 text-paper"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-graphite">Marketplace</label>
          <select
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
            className="mt-1 w-full rounded-card border border-white/15 bg-ink-soft px-3 py-2 text-paper"
          >
            {MARKETPLACES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-graphite">Photos (up to 6)</label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="mt-1 w-full text-sm text-graphite file:mr-3 file:rounded-card file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-ink"
        />
        {files.length > 0 && <p className="mt-1 text-xs text-graphite">{files.length} photo(s) selected</p>}
      </div>

      {error && <p className="text-sm text-risk">{error}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-card bg-profit py-3 font-display font-semibold text-paper transition-opacity disabled:opacity-60"
      >
        {status === 'submitting' ? 'Analyzing...' : 'Get my Flip Score'}
      </button>
    </form>
  );
}
