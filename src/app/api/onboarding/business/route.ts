import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { name, industry, description, productsServices, targetAudience, location, brandPersonality, goals, website } = body;

  if (!name || !industry) {
    return NextResponse.json({ error: 'Business name and industry are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('businesses')
    .insert({
      user_id: user.id,
      name,
      industry,
      description: description ?? '',
      products_services: productsServices ?? '',
      target_audience: targetAudience ?? '',
      location: location ?? '',
      brand_personality: brandPersonality ?? [],
      goals: goals ?? [],
      website: website || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
