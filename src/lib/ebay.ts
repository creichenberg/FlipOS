// eBay Browse API client (Phase 2). Uses the client-credentials OAuth flow,
// which is scoped to public browse/search - no per-user eBay login needed.

export class EbayNotConfiguredError extends Error {
  constructor() {
    super('eBay search is not configured. Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.');
    this.name = 'EbayNotConfiguredError';
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getEbayAccessToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new EbayNotConfiguredError();

  // Refresh a little before actual expiry so an in-flight search never races a stale token.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope',
    }),
  });

  if (!res.ok) {
    throw new Error(`eBay auth failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

export interface EbaySearchParams {
  query: string;
  categoryId?: string;
  maxPrice?: number;
  limit?: number;
}

export interface EbaySearchResult {
  ebayItemId: string;
  title: string;
  price: number;
  condition: string | null;
  imageUrl: string | null;
  itemWebUrl: string;
  categoryName: string | null;
}

interface EbayItemSummary {
  itemId: string;
  title: string;
  price?: { value: string; currency: string };
  condition?: string;
  image?: { imageUrl: string };
  itemWebUrl: string;
  categories?: { categoryId: string; categoryName: string }[];
}

export async function searchEbayListings(params: EbaySearchParams): Promise<EbaySearchResult[]> {
  const token = await getEbayAccessToken();

  const searchParams = new URLSearchParams({ q: params.query, limit: String(params.limit ?? 24) });
  if (params.categoryId) searchParams.set('category_ids', params.categoryId);
  if (params.maxPrice) {
    searchParams.set('filter', `price:[..${params.maxPrice}],priceCurrency:USD`);
  }

  const res = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': process.env.EBAY_MARKETPLACE_ID || 'EBAY_US',
    },
  });

  if (!res.ok) {
    throw new Error(`eBay search failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { itemSummaries?: EbayItemSummary[] };

  return (data.itemSummaries ?? []).map((item) => ({
    ebayItemId: item.itemId,
    title: item.title,
    price: parseFloat(item.price?.value ?? '0'),
    condition: item.condition ?? null,
    imageUrl: item.image?.imageUrl ?? null,
    itemWebUrl: item.itemWebUrl,
    categoryName: item.categories?.[0]?.categoryName ?? null,
  }));
}
