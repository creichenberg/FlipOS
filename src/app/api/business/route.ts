import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CaptionStyle, EditStyle } from '@/lib/types/database';

const CAPTION_STYLES: CaptionStyle[] = ['outline-pop', 'bold-pill', 'minimal'];
const EDIT_STYLES: EditStyle[] = ['subtle', 'punchy'];

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const {
    ownerName,
    name,
    industry,
    description,
    productsServices,
    targetAudience,
    location,
    brandPersonality,
    goals,
    website,
    captionStyle,
    editStyle,
  } = body;

  if (!ownerName || !name || !industry) {
    return NextResponse.json({ error: 'Your name, business name, and industry are required' }, { status: 400 });
  }
  // These ride in from a fixed set of buttons, not free text, but this is a
  // request-boundary input like everything else in this handler - validate
  // rather than trust it, same reasoning as the required-field checks above.
  if (captionStyle !== undefined && !CAPTION_STYLES.includes(captionStyle)) {
    return NextResponse.json({ error: 'Invalid caption style' }, { status: 400 });
  }
  if (editStyle !== undefined && !EDIT_STYLES.includes(editStyle)) {
    return NextResponse.json({ error: 'Invalid edit style' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('businesses')
    .update({
      owner_name: ownerName,
      name,
      industry,
      description: description ?? '',
      products_services: productsServices ?? '',
      target_audience: targetAudience ?? '',
      location: location ?? '',
      brand_personality: brandPersonality ?? [],
      goals: goals ?? [],
      website: website || null,
      ...(captionStyle !== undefined ? { caption_style: captionStyle } : {}),
      ...(editStyle !== undefined ? { edit_style: editStyle } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
