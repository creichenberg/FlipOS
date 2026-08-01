'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone } from 'lucide-react';

// Resolves the absolute URL client-side (window.location) rather than via a
// server-computed host header, so it's automatically correct on every
// deployment - preview URLs, a custom domain, or localhost during dev.
export function QrCode({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  return (
    <div className="hidden items-center gap-4 rounded-lg border border-border-subtle bg-surface p-5 lg:flex">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle">
        <Smartphone className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">Continue on your phone</p>
        <p className="mt-0.5 text-sm text-text-secondary">
          Scan to open this shot list on your phone and film clips straight into it as you go.
        </p>
      </div>
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-white p-2">
        {url ? <QRCodeSVG value={url} size={80} /> : null}
      </div>
    </div>
  );
}
