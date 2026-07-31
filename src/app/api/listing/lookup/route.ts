import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEbayItemByLegacyId, parseEbayItemId, EbayNotConfiguredError } from '@/lib/ebay';
import { fetchListingFromUrl } from '@/lib/listingLookup';

export const dynamic = 'force-dynamic';

const RequestSchema = z.object({ url: z.string().url() });

export async function POST(req: NextRequest) {
  const parsed = RequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Paste a valid listing URL.' }, { status: 400 });
  }
  const { url } = parsed.data;

  const ebayItemId = parseEbayItemId(url);
  if (ebayItemId) {
    try {
      const item = await getEbayItemByLegacyId(ebayItemId);
      return NextResponse.json({
        listing: {
          title: item.title,
          description: item.description,
          askingPrice: item.price || null,
          marketplace: 'eBay',
          imageUrl: item.imageUrl,
        },
      });
    } catch (err) {
      if (err instanceof EbayNotConfiguredError) {
        return NextResponse.json({ error: err.message }, { status: 501 });
      }
      console.error('eBay item lookup failed', err);
      return NextResponse.json({ error: 'Could not fetch that eBay listing. Try pasting the details manually.' }, { status: 502 });
    }
  }

  try {
    const listing = await fetchListingFromUrl(url);
    if (!listing.title) {
      return NextResponse.json(
        { error: "Couldn't read that page - it may require a login. Fill in the details manually." },
        { status: 502 }
      );
    }
    return NextResponse.json({ listing });
  } catch (err) {
    console.error('Generic listing lookup failed', err);
    return NextResponse.json(
      { error: "Couldn't fetch that page - it may block automated requests. Fill in the details manually." },
      { status: 502 }
    );
  }
}
