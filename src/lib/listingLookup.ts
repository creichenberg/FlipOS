import * as cheerio from 'cheerio';

export interface FetchedListing {
  title: string | null;
  description: string | null;
  askingPrice: number | null;
  imageUrl: string | null;
  marketplace: string | null;
}

function guessMarketplace(hostname: string): string | null {
  if (hostname.includes('facebook.com')) return 'Facebook Marketplace';
  if (hostname.includes('craigslist.org')) return 'Craigslist';
  if (hostname.includes('offerup.com')) return 'OfferUp';
  if (hostname.includes('mercari.com')) return 'Mercari';
  if (hostname.includes('poshmark.com')) return 'Poshmark';
  if (hostname.includes('ebay.com')) return 'eBay';
  return null;
}

function parsePrice(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const match = raw.replace(/,/g, '').match(/(\d+(?:\.\d{1,2})?)/);
  return match ? parseFloat(match[1]) : null;
}

// Best-effort listing scrape for marketplaces without a public API (Facebook
// Marketplace, Craigslist, OfferUp, ...): reads Open Graph tags and any
// Product JSON-LD block, which most listing pages include for link
// previews / SEO even when there's no API. Never throws - callers should
// treat a mostly-empty result as "couldn't tell, let the user fill it in."
export async function fetchListingFromUrl(url: string): Promise<FetchedListing> {
  const parsed = new URL(url);

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Could not fetch that page (${res.status}).`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const og = (prop: string) => $(`meta[property="${prop}"]`).attr('content') ?? $(`meta[name="${prop}"]`).attr('content');

  let title = og('og:title') ?? $('title').first().text() ?? null;
  let description = og('og:description') ?? null;
  let imageUrl = og('og:image') ?? null;
  let price = parsePrice(og('product:price:amount') ?? og('og:price:amount'));

  // Fall back to Product JSON-LD, which many listing pages embed for SEO
  // even when Open Graph price tags are missing.
  $('script[type="application/ld+json"]').each((_, el) => {
    if (price != null && title) return;
    try {
      const parsed = JSON.parse($(el).contents().text());
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (node?.['@type'] !== 'Product' && node?.['@type'] !== 'Offer') continue;
        title = title ?? node.name ?? null;
        description = description ?? node.description ?? null;
        imageUrl = imageUrl ?? (Array.isArray(node.image) ? node.image[0] : node.image) ?? null;
        const offerPrice = node.offers?.price ?? node.price;
        if (price == null) price = parsePrice(offerPrice ? String(offerPrice) : null);
      }
    } catch {
      // Not valid/relevant JSON-LD - ignore and keep whatever we already found.
    }
  });

  return {
    title: title ? title.trim() : null,
    description: description ? description.trim() : null,
    askingPrice: price,
    imageUrl,
    marketplace: guessMarketplace(parsed.hostname),
  };
}
