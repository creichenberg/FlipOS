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
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-graphite">Listing title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Sony A7 III Camera Body"
          className="field mt-1.5"
        />
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-graphite">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Anything the seller wrote about condition, accessories, flaws..."
          className="field mt-1.5"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-graphite">Asking price</label>
          <div className="field mt-1.5 flex items-center py-0 pl-3.5">
            <span className="text-graphite">$</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              className="w-full bg-transparent py-2.5 pl-1 text-paper focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-graphite">Marketplace</label>
          <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)} className="field mt-1.5">
            {MARKETPLACES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-graphite">Photos (up to 6)</label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="mt-1.5 w-full text-sm text-graphite file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3.5 file:py-1.5 file:text-paper file:transition-colors hover:file:bg-white/[0.16]"
        />
        {files.length > 0 && <p className="mt-1.5 text-xs text-graphite">{files.length} photo(s) selected</p>}
      </div>

      {error && <p className="text-sm text-risk">{error}</p>}

      <button type="submit" disabled={status === 'submitting'} className="btn-primary w-full">
        {status === 'submitting' ? 'Analyzing...' : 'Get my Flip Score'}
      </button>
    </form>
  );
}
