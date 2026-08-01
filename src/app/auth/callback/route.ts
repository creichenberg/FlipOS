import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Supabase magic-link / OAuth redirect target. Exchanges the auth code for a
// session, then hands off to middleware to route to /onboarding or wherever
// the user was originally headed (e.g. a QR code deep-linking to Filming
// Mode) via `next` - defaulting to /dashboard if it's missing or unsafe.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  // Same-origin relative path only - `next` rides along on an otherwise
  // public URL, so treating an absolute/protocol-relative value as trusted
  // would be an open-redirect vulnerability.
  const destination = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
